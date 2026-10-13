/**
 * AI Site Generator with Anti-Invention Guardrails
 *
 * Generates a complete site draft from a BusinessProfile + template
 * with strict grounding (no invented data), guardrails, and token caps.
 */

import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { generateResponse } from "@/lib/ai/router";
import { applyGuardrails } from "@/lib/demos/knowledge";
import type { TenantWhatsAppConfig } from "@/lib/whatsapp/config";

/**
 * A single generated page draft.
 */
export interface SitePageDraft {
  path: string;
  title: string;
  content: { blocks: any[] };
  meta: { title: string; description: string; ogImage?: string; noindex?: boolean };
}

/**
 * Complete site draft output.
 */
export interface SiteDraft {
  pages: SitePageDraft[];
  totalTokens: number;
  generatedAt: Date;
}

/**
 * System prompt for the AI generator - strict anti-invention rules.
 */
const SYSTEM_PROMPT = `Eres un generador de contenido para sitios web de negocios locales en Chile.
REGLAS ESTRICTAS:
1. SOLO usa la información provista en el perfil del negocio (JSON). NO inventes nada.
2. Si un dato requerido NO está en el perfil, escribe exactamente: {{TODO: nombre_del_campo}}
3. NUNCA inventes precios, horarios, teléfonos, direcciones, nombres de equipo, servicios.
4. Precios: SOLO si existen en services[].priceCLP. Si no, {{TODO: price}}.
5. Horarios: SOLO si existen en hours. Si no, {{TODO: hours}}.
6. Teléfono: SOLO si existe en phone. Si no, {{TODO: phone}}.
7. Equipo: SOLO nombres/roles de team[]. Si no, {{TODO: team}}.
8. Responde en español chileno (tuteo), tono profesional pero cercano.
9. Máximo 800 tokens por página.
10. Output: JSON válido con la estructura de bloques solicitada.`;

/**
 * Approximate token count for Spanish text.
 */
function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Replaces missing profile fields with {{TODO: fieldName}} placeholders.
 */
function applyPlaceholders(template: string, profile: Record<string, any>, requiredVars: string[]): string {
  let result = template;

  for (const variable of requiredVars) {
    const placeholder = `{{${variable}}}`;
    let value: any;

    // Extract value from profile based on variable name
    switch (variable) {
      case "businessName":
        value = profile.name;
        break;
      case "tagline":
        value = profile.description?.split(".")[0] || profile.name;
        break;
      case "phone":
        value = profile.phone;
        break;
      case "email":
        value = profile.email;
        break;
      case "address":
        value = profile.address;
        break;
      case "hours":
        value = profile.hours && Object.keys(profile.hours).length > 0
          ? JSON.stringify(profile.hours)
          : undefined;
        break;
      case "services":
        value = profile.services && profile.services.length > 0
          ? JSON.stringify(profile.services.map((s: any) => ({
              name: s.name,
              description: s.description,
              priceCLP: s.priceCLP,
              durationMin: s.durationMin,
            })))
          : undefined;
        break;
      case "team":
        value = profile.team && profile.team.length > 0
          ? JSON.stringify(profile.team.map((t: any) => ({
              name: t.name,
              role: t.role,
              bio: t.bio,
              photoUrl: t.photoUrl,
            })))
          : undefined;
        break;
      case "faqs":
        value = profile.faqs && profile.faqs.length > 0
          ? JSON.stringify(profile.faqs)
          : undefined;
        break;
      case "images":
        value = profile.images && profile.images.length > 0
          ? JSON.stringify(profile.images)
          : undefined;
        break;
      case "logoUrl":
        value = profile.logoUrl;
        break;
      case "social":
        value = profile.social && Object.keys(profile.social).length > 0
          ? JSON.stringify(profile.social)
          : undefined;
        break;
      case "description":
        value = profile.description;
        break;
      default:
        value = profile[variable];
    }

    const replacement = value !== undefined && value !== null && value !== "" && value !== "{}"
      ? String(value)
      : `{{TODO: ${variable}}}`;

    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), replacement);
  }

  return result;
}

/**
 * Builds the user prompt for a specific template page.
 */
function buildUserPrompt(templatePage: any, profile: Record<string, any>): string {
  const promptData = {
    pagePath: templatePage.path,
    pageTitle: templatePage.title,
    blocksTemplate: templatePage.blocksTemplate.map((block: any) => ({
      type: block.type,
      content: block.content,
      requiredVariables: block.requiredVariables,
    })),
    profile,
  };

  return JSON.stringify(promptData, null, 2);
}

/**
 * Parses AI response into structured page content.
 * Merges AI-generated blocks with template blocks to ensure all required blocks are present.
 */
function parseAIResponse(responseText: string, templatePage: any): { blocks: any[]; meta: SitePageDraft["meta"] } {
  try {
    const parsed = JSON.parse(responseText);

    // Validate structure
    if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
      throw new Error("Invalid response: missing blocks array");
    }

    const aiBlocks = parsed.blocks;

    // Merge with template blocks: ensure all template block types are present
    // Template blocks define the structure; AI blocks provide the filled content
    const mergedBlocks = templatePage.blocksTemplate.map((templateBlock: any) => {
      // Find matching AI block by type
      const aiBlock = aiBlocks.find((b: any) => b.type === templateBlock.type);
      if (aiBlock) {
        // Merge: keep template structure but use AI content
        return {
          type: templateBlock.type,
          content: { ...templateBlock.content, ...aiBlock.content },
          requiredVariables: templateBlock.requiredVariables,
        };
      }
      // No AI block for this template block - use template as-is (will get placeholders)
      return {
        type: templateBlock.type,
        content: templateBlock.content,
        requiredVariables: templateBlock.requiredVariables,
      };
    });

    return {
      blocks: mergedBlocks,
      meta: parsed.meta || {
        title: templatePage.title,
        description: "",
        ogImage: "",
        noindex: false,
      },
    };
  } catch (error) {
    // Fallback: return template blocks as-is (will get placeholders applied)
    console.error("[generator] Failed to parse AI response:", error);
    return {
      blocks: templatePage.blocksTemplate.map((tb: any) => ({
        type: tb.type,
        content: tb.content,
        requiredVariables: tb.requiredVariables,
      })),
      meta: {
        title: templatePage.title,
        description: "",
        ogImage: "",
        noindex: false,
      },
    };
  }
}

/**
 * Builds factory config for the AI router based on rubro and tier.
 */
function buildFactoryConfig(rubro: string, planTier: string): TenantWhatsAppConfig {
  // Base config adapted from demoConfigFor for factory use
  return {
    tone: "amable",
    knowledgeBase: `Perfil de negocio: ${rubro}. Genera contenido para sitio web profesional.`,
    preferLocalAi: planTier !== "elite",
    maxTokensResponse: 800,
    escalationKeywords: [],
    businessHours: "09:00-18:00",
    autoReplyEnabled: true,
    escalationNotify: "none",
    escalationMessage: "",
    voiceReplyEnabled: false,
    voiceId: "",
  };
}

/**
 * Generates a complete site draft from BusinessProfile + template.
 *
 * @param siteId - Site ID to generate
 * @param tenantId - Tenant ID (for multi-tenant isolation via withTenant)
 * @returns SiteDraft with all generated pages
 * @throws Error if site not found, not owned by tenant, status not draft, or no businessProfile
 */
export async function generateSiteDraft(siteId: string, tenantId: string): Promise<SiteDraft> {
  if (!tenantId) {
    throw new Error("withTenant() requiere un tenantId valido");
  }

  return withTenant(tenantId, async (tx) => {
    // 1. Load Site + BusinessProfile + SiteTemplate + SiteTemplatePage[]
    const site = await tx.site.findUnique({
      where: { id: siteId },
      include: {
        businessProfile: true,
        template: true,
      },
    });

    if (!site) {
      throw new Error("Site not found");
    }

    if (site.tenantId !== tenantId) {
      throw new Error("Site not owned by tenant");
    }

    if (site.status !== "draft") {
      throw new Error("Site status must be 'draft'");
    }

    if (!site.businessProfile) {
      throw new Error("BusinessProfile not found");
    }

    const templatePages = await tx.siteTemplatePage.findMany({
      where: { templateId: site.templateId },
      orderBy: { order: "asc" },
    });

    if (!templatePages || templatePages.length === 0) {
      throw new Error("No template pages found for this site");
    }

    const profile = site.businessProfile as any;
    const rubro = profile.rubro;
    const planTier = site.template.planTier;
    const useOpenRouter = planTier === "elite";

    const factoryConfig = buildFactoryConfig(rubro, planTier);

    const generatedPages: SitePageDraft[] = [];
    let totalTokens = 0;

    // 2. For each template page, generate content
    for (const templatePage of templatePages) {
      // Build prompt with profile JSON + template blocks
      const userPrompt = buildUserPrompt(templatePage, profile);

      // Call generateResponse with useOpenRouter based on tier
      const aiResult = await generateResponse(
        userPrompt,
        [], // empty history for generation
        factoryConfig,
        useOpenRouter
      );

      // Post-process with applyGuardrails
      const guardedReply = applyGuardrails(aiResult.text, rubro);

      // Parse reply into SitePageDraft
      const { blocks, meta } = parseAIResponse(guardedReply, templatePage);

      // Apply placeholders for any remaining unfilled variables
      const filledBlocks = blocks.map((block) => ({
        ...block,
        content: Object.fromEntries(
          Object.entries(block.content).map(([key, value]) => [
            key,
            typeof value === "string" ? applyPlaceholders(value, profile, templatePage.requiredVariables) : value,
          ])
        ),
      }));

      // Validate token count ≤ 800/page
      const pageContentStr = JSON.stringify({ blocks: filledBlocks, meta });
      let pageTokens = countTokens(pageContentStr);

      if (pageTokens > 800) {
        // Truncate blocks to fit within token limit
        console.warn(`[generator] Page ${templatePage.path} exceeds 800 tokens (${pageTokens}), truncating`);
        // Aggressive truncation: iteratively reduce until under limit
        let attempts = 0;
        while (pageTokens > 800 && attempts < 5) {
          const ratio = 800 / pageTokens;
          for (const block of filledBlocks) {
            for (const key of Object.keys(block.content)) {
              if (typeof block.content[key] === "string") {
                const maxLen = Math.max(20, Math.floor(block.content[key].length * ratio * 0.9));
                block.content[key] = block.content[key].substring(0, maxLen) + "...";
              } else if (Array.isArray(block.content[key])) {
                // Truncate arrays
                const maxItems = Math.max(1, Math.floor(block.content[key].length * ratio * 0.9));
                block.content[key] = block.content[key].slice(0, maxItems);
              }
            }
          }
          const truncatedStr = JSON.stringify({ blocks: filledBlocks, meta });
          pageTokens = countTokens(truncatedStr);
          attempts++;
        }
        // If still over, remove blocks from the end
        while (pageTokens > 800 && filledBlocks.length > 1) {
          filledBlocks.pop();
          const truncatedStr = JSON.stringify({ blocks: filledBlocks, meta });
          pageTokens = countTokens(truncatedStr);
        }
      }

      totalTokens += pageTokens;

      generatedPages.push({
        path: templatePage.path,
        title: templatePage.title,
        content: { blocks: filledBlocks },
        meta,
      });

      // Enforce total cap
      if (totalTokens > 4000) {
        console.warn(`[generator] Total tokens exceed 4000 cap (${totalTokens}), stopping`);
        break;
      }
    }

    // 4. Write draft pages to DB (upsert SitePage)
    for (const page of generatedPages) {
      await tx.sitePage.upsert({
        where: {
          siteId_path: {
            siteId,
            path: page.path,
          },
        },
        update: {
          title: page.title,
          content: page.content,
          meta: page.meta,
        },
        create: {
          siteId,
          templatePageId: templatePages.find((tp) => tp.path === page.path)?.id,
          path: page.path,
          title: page.title,
          content: page.content,
          meta: page.meta,
        },
      });
    }

    // 5. Create SiteVersion v1 (snapshot of all pages)
    const siteVersion = await tx.siteVersion.create({
      data: {
        siteId,
        version: 1,
        pages: generatedPages.map((p) => ({
          path: p.path,
          title: p.title,
          content: p.content,
          meta: p.meta,
        })),
        changelog: "Initial AI generation",
        createdBy: "system",
      },
    });

    // 6. Update Site.status = 'review', currentVersionId = v1
    await tx.site.update({
      where: { id: siteId },
      data: {
        status: "review",
        currentVersionId: siteVersion.id,
      },
    });

    return {
      pages: generatedPages,
      totalTokens,
      generatedAt: new Date(),
    };
  });
}