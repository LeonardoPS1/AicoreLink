import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock external dependencies
vi.mock("@/lib/tenant-context", () => ({
  withTenant: vi.fn(async (tenantId: string, fn: any) => {
    if (!tenantId) throw new Error("withTenant() requiere un tenantId valido");
    return fn(mockTx);
  }),
}));

vi.mock("@/lib/ai/router", () => ({
  generateResponse: vi.fn(),
}));

vi.mock("@/lib/demos/knowledge", () => ({
  applyGuardrails: vi.fn((reply: string) => reply),
  demoConfigFor: vi.fn(() => ({
    tone: "amable",
    knowledgeBase: "Test business knowledge",
    maxTokensResponse: 800,
    preferLocalAi: true,
    escalationKeywords: [],
    businessHours: "09:00-18:00",
    autoReplyEnabled: true,
    escalationNotify: "none",
    escalationMessage: "",
    voiceReplyEnabled: false,
    voiceId: "",
  })),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(async (fn: any) => fn(mockTx)),
  },
}));

import { withTenant } from "@/lib/tenant-context";
import { generateResponse } from "@/lib/ai/router";
import { applyGuardrails } from "@/lib/demos/knowledge";
import { generateSiteDraft, type SitePageDraft, type SiteDraft } from "@/lib/factory/generator";

const mockTx = {
  site: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  businessProfile: {
    findUnique: vi.fn(),
  },
  siteTemplate: {
    findUnique: vi.fn(),
  },
  siteTemplatePage: {
    findMany: vi.fn(),
  },
  sitePage: {
    upsert: vi.fn(),
  },
  siteVersion: {
    create: vi.fn(),
  },
};

describe("generateSiteDraft - AI Site Generator with Anti-Invention Guardrails", () => {
  const tenantId = "tenant-123";
  const siteId = "site-123";
  const templateId = "template-123";

  const mockBusinessProfile = {
    id: "bp-1",
    tenantId,
    rubro: "barberia",
    name: "Barbería El Corte",
    slug: "barberia-el-corte",
    phone: "+56912345678",
    email: "contacto@barberiaelcorte.cl",
    address: "Av. Principal 123, Santiago",
    description: "La mejor barbería de la ciudad",
    logoUrl: "https://example.com/logo.png",
    images: ["https://example.com/img1.jpg"],
    hours: { lunes: { open: "09:00", close: "19:00" }, martes: { open: "09:00", close: "19:00" } },
    team: [{ name: "Juan Pérez", role: "Barbero", bio: "10 años experiencia" }],
    services: [{ name: "Corte clásico", description: "Corte tradicional", priceCLP: 15000, durationMin: 30 }],
    faqs: [{ question: "¿Atienden domingo?", answer: "No, solo lunes a sábado" }],
    social: { instagram: "https://instagram.com/barberiaelcorte" },
  };

  const mockSite = {
    id: siteId,
    tenantId,
    businessProfileId: mockBusinessProfile.id,
    templateId,
    status: "draft",
    name: "Barbería El Corte",
    subdomain: "barberia-el-corte",
    businessProfile: mockBusinessProfile,
    template: {
      id: templateId,
      rubro: "barberia",
      planTier: "starter",
      pageCount: 3,
    },
  };

  const mockTemplatePages = [
    {
      id: "tp-1",
      templateId,
      path: "/",
      title: "Inicio",
      order: 0,
      blocksTemplate: [
        {
          type: "hero",
          content: { headline: "Tu {{businessName}} atendiendo", subheadline: "{{tagline}}", ctaPrimary: "Reservar", ctaSecondary: "WhatsApp" },
          requiredVariables: ["businessName", "tagline"],
        },
        {
          type: "services",
          content: { sectionTitle: "Servicios", items: "{{services}}", prices: "{{prices}}" },
          requiredVariables: ["services"],
        },
      ],
      requiredVariables: ["businessName", "tagline", "services"],
    },
    {
      id: "tp-2",
      templateId,
      path: "/contacto",
      title: "Contacto",
      order: 1,
      blocksTemplate: [
        {
          type: "contact",
          content: { phone: "{{phone}}", email: "{{email}}", address: "{{address}}", hours: "{{hours}}" },
          requiredVariables: ["phone", "email", "address", "hours"],
        },
      ],
      requiredVariables: ["phone", "email", "address", "hours"],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful DB responses
    mockTx.site.findUnique.mockResolvedValue(mockSite);

    mockTx.siteTemplatePage.findMany.mockResolvedValue(mockTemplatePages);

    mockTx.sitePage.upsert.mockResolvedValue({});
    mockTx.siteVersion.create.mockResolvedValue({ id: "sv-1", version: 1 });
    mockTx.site.update.mockResolvedValue({});

    // Default AI response
    (generateResponse as any).mockResolvedValue({
      text: JSON.stringify({
        blocks: [
          { type: "hero", content: { headline: "Tu Barbería El Corte atendiendo", subheadline: "La mejor barbería de la ciudad", ctaPrimary: "Reservar", ctaSecondary: "WhatsApp" } },
          { type: "services", content: { sectionTitle: "Servicios", items: [{ name: "Corte clásico", priceCLP: 15000 }], prices: "Desde $15.000 CLP" } },
        ],
        meta: { title: "Barbería El Corte", description: "La mejor barbería de la ciudad", ogImage: "" },
      }),
      tokensUsed: 150,
      usedOpenRouter: false,
    });

    (applyGuardrails as any).mockImplementation((reply: string) => reply);
  });

  describe("Grounding - ONLY uses BusinessProfile data", () => {
    it("fills template variables with actual BusinessProfile data", async () => {
      const result = await generateSiteDraft(siteId, tenantId);

      expect(result.pages).toHaveLength(2);
      const homePage = result.pages.find((p) => p.path === "/");
      expect(homePage).toBeDefined();
      // The generated content should contain actual business data
      const contentStr = JSON.stringify(homePage!.content);
      expect(contentStr).toContain("Barbería El Corte");
      expect(contentStr).toContain("La mejor barbería");
    });

    it("uses {{TODO: fieldName}} placeholder when field is missing from profile", async () => {
      const incompleteProfile = {
        ...mockBusinessProfile,
        phone: null,
        email: null,
        address: null,
        hours: {},
        team: [],
        services: [],
        faqs: [],
      };
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        businessProfile: incompleteProfile,
      });

      const result = await generateSiteDraft(siteId, tenantId);

      const contactPage = result.pages.find((p) => p.path === "/contacto");
      const contentStr = JSON.stringify(contactPage!.content);
      // Missing fields should have TODO placeholders
      expect(contentStr).toContain("{{TODO: phone}}");
      expect(contentStr).toContain("{{TODO: email}}");
      expect(contentStr).toContain("{{TODO: address}}");
      expect(contentStr).toContain("{{TODO: hours}}");
    });

    it("NEVER invents prices - shows {{TODO: price}} when priceCLP missing", async () => {
      const profileNoPrices = {
        ...mockBusinessProfile,
        services: [{ name: "Corte", description: "Corte simple" }], // no priceCLP
      };
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        businessProfile: profileNoPrices,
      });

      // Mock AI response without prices
      (generateResponse as any).mockResolvedValueOnce({
        text: JSON.stringify({
          blocks: [
            { type: "hero", content: { headline: "Tu Barbería El Corte atendiendo", subheadline: "La mejor barbería de la ciudad", ctaPrimary: "Reservar", ctaSecondary: "WhatsApp" } },
            { type: "services", content: { sectionTitle: "Servicios", items: [{ name: "Corte" }], prices: "{{TODO: price}}" } },
          ],
          meta: { title: "Barbería El Corte", description: "La mejor barbería de la ciudad", ogImage: "" },
        }),
        tokensUsed: 150,
        usedOpenRouter: false,
      });

      const result = await generateSiteDraft(siteId, tenantId);

      const homePage = result.pages.find((p) => p.path === "/");
      const contentStr = JSON.stringify(homePage!.content);
      expect(contentStr).toContain("{{TODO: price}}");
      // Should NOT contain invented price numbers
      expect(contentStr).not.toMatch(/\$\d+/);
      expect(contentStr).not.toMatch(/\d+\s*CLP/i);
    });

    it("NEVER invents phone numbers", async () => {
      const profileNoPhone = { ...mockBusinessProfile, phone: null };
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        businessProfile: profileNoPhone,
      });

      const result = await generateSiteDraft(siteId, tenantId);

      const contactPage = result.pages.find((p) => p.path === "/contacto");
      const contentStr = JSON.stringify(contactPage!.content);
      expect(contentStr).toContain("{{TODO: phone}}");
      expect(contentStr).not.toMatch(/\+569\d{8}/);
    });

    it("NEVER invents hours", async () => {
      const profileNoHours = { ...mockBusinessProfile, hours: {} };
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        businessProfile: profileNoHours,
      });

      const result = await generateSiteDraft(siteId, tenantId);

      const contactPage = result.pages.find((p) => p.path === "/contacto");
      const contentStr = JSON.stringify(contactPage!.content);
      expect(contentStr).toContain("{{TODO: hours}}");
    });

    it("NEVER invents team members", async () => {
      const profileNoTeam = { ...mockBusinessProfile, team: [] };
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        businessProfile: profileNoTeam,
      });

      const result = await generateSiteDraft(siteId, tenantId);

      // Check any page that might have team content
      for (const page of result.pages) {
        const contentStr = JSON.stringify(page.content);
        if (contentStr.includes("team") || contentStr.includes("equipo")) {
          expect(contentStr).toContain("{{TODO: team}}");
        }
      }
    });
  });

  describe("Token Cap Enforcement", () => {
    it("enforces ≤800 tokens per page", async () => {
      // Mock a very long AI response
      (generateResponse as any).mockResolvedValueOnce({
        text: JSON.stringify({
          blocks: [{ type: "hero", content: { headline: "A".repeat(5000) } }],
          meta: { title: "Test", description: "Test" },
        }),
        tokensUsed: 1000, // Over 800 cap
        usedOpenRouter: false,
      });

      const result = await generateSiteDraft(siteId, tenantId);

      // Should handle token cap - either truncate or the page tokens should be <= 800
      for (const page of result.pages) {
        // Approximate token count: text.length / 4
        const pageTokens = Math.ceil(JSON.stringify(page.content).length / 4);
        expect(pageTokens).toBeLessThanOrEqual(800);
      }
    });

    it("enforces ≤4000 tokens total across all pages", async () => {
      const result = await generateSiteDraft(siteId, tenantId);
      expect(result.totalTokens).toBeLessThanOrEqual(4000);
    });
  });

  describe("Guardrails Application", () => {
    it("calls applyGuardrails on each page reply", async () => {
      await generateSiteDraft(siteId, tenantId);

      // applyGuardrails should be called once per page
      expect(applyGuardrails).toHaveBeenCalledTimes(2);
    });

    it("uses rubro from business profile for guardrails", async () => {
      await generateSiteDraft(siteId, tenantId);

      expect(applyGuardrails).toHaveBeenCalledWith(expect.any(String), "barberia");
    });
  });

  describe("Model Routing", () => {
    it("uses OpenRouter (useOpenRouter=true) when tier=elite", async () => {
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        template: {
          id: templateId,
          rubro: "barberia",
          planTier: "elite",
          pageCount: 10,
        },
      });

      await generateSiteDraft(siteId, tenantId);

      // Check that generateResponse was called with useOpenRouter=true
      const calls = (generateResponse as any).mock.calls;
      for (const call of calls) {
        expect(call[3]).toBe(true); // useOpenRouter = 4th argument
      }
    });

    it("uses Ollama (useOpenRouter=false) when tier=starter", async () => {
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        template: {
          id: templateId,
          rubro: "barberia",
          planTier: "starter",
          pageCount: 3,
        },
      });

      await generateSiteDraft(siteId, tenantId);

      const calls = (generateResponse as any).mock.calls;
      for (const call of calls) {
        expect(call[3]).toBe(false); // useOpenRouter = 4th argument
      }
    });

    it("uses Ollama (useOpenRouter=false) when tier=growth", async () => {
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        template: {
          id: templateId,
          rubro: "barberia",
          planTier: "growth",
          pageCount: 5,
        },
      });

      await generateSiteDraft(siteId, tenantId);

      const calls = (generateResponse as any).mock.calls;
      for (const call of calls) {
        expect(call[3]).toBe(false);
      }
    });
  });

  describe("Multi-tenant Isolation", () => {
    it("uses withTenant for all DB operations", async () => {
      await generateSiteDraft(siteId, tenantId);

      expect(withTenant).toHaveBeenCalledWith(tenantId, expect.any(Function));
    });

    it("throws when tenantId is empty", async () => {
      await expect(generateSiteDraft(siteId, "")).rejects.toThrow("withTenant() requiere un tenantId valido");
    });
  });

  describe("Site Validation", () => {
    it("throws 400 when site status is not 'draft'", async () => {
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        status: "review",
      });

      await expect(generateSiteDraft(siteId, tenantId)).rejects.toThrow("Site status must be 'draft'");
    });

    it("throws 400 when businessProfile not found", async () => {
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        businessProfile: null,
      });

      await expect(generateSiteDraft(siteId, tenantId)).rejects.toThrow("BusinessProfile not found");
    });

    it("throws 403 when site belongs to different tenant", async () => {
      mockTx.site.findUnique.mockResolvedValue({
        ...mockSite,
        tenantId: "other-tenant",
      });

      await expect(generateSiteDraft(siteId, tenantId)).rejects.toThrow("Site not owned by tenant");
    });
  });

  describe("Output Structure", () => {
    it("returns SiteDraft with pages, totalTokens, generatedAt", async () => {
      const result = await generateSiteDraft(siteId, tenantId);

      expect(result).toHaveProperty("pages");
      expect(result).toHaveProperty("totalTokens");
      expect(result).toHaveProperty("generatedAt");
      expect(Array.isArray(result.pages)).toBe(true);
      expect(typeof result.totalTokens).toBe("number");
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it("each SitePageDraft has path, title, content, meta", async () => {
      const result = await generateSiteDraft(siteId, tenantId);

      for (const page of result.pages) {
        expect(page).toHaveProperty("path");
        expect(page).toHaveProperty("title");
        expect(page).toHaveProperty("content");
        expect(page).toHaveProperty("meta");
        expect(page.meta).toHaveProperty("title");
        expect(page.meta).toHaveProperty("description");
      }
    });

    it("writes SitePage records to DB", async () => {
      await generateSiteDraft(siteId, tenantId);

      expect(mockTx.sitePage.upsert).toHaveBeenCalledTimes(2); // 2 pages
    });

    it("creates SiteVersion v1 snapshot", async () => {
      await generateSiteDraft(siteId, tenantId);

      expect(mockTx.siteVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            siteId,
            version: 1,
            pages: expect.any(Array),
          }),
        })
      );
    });

    it("updates Site status to 'review'", async () => {
      await generateSiteDraft(siteId, tenantId);

      expect(mockTx.site.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: siteId },
          data: expect.objectContaining({ status: "review", currentVersionId: "sv-1" }),
        })
      );
    });
  });

  describe("Chilean Tuteo", () => {
    it("generates content in Chilean tuteo (no voseo)", async () => {
      const result = await generateSiteDraft(siteId, tenantId);

      const allContent = result.pages.map((p) => JSON.stringify(p.content)).join(" ");
      // Should not contain voseo forms
      expect(allContent).not.toMatch(/vos\b/i);
      expect(allContent).not.toMatch(/vosotros\b/i);
    });
  });
});