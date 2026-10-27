import type { Prisma } from "@prisma/client";
import { withTenant } from "@/lib/tenant-context";

export interface TenantWhatsAppConfig {
  // General
  tone: "formal" | "amable" | "empatico";
  businessHours: string;
  knowledgeBase: string;
  autoReplyEnabled: boolean;
  // IA
  preferLocalAi: boolean;
  maxTokensResponse: number;
  // Escalado
  escalationKeywords: string[];
  escalationNotify: "email" | "telegram" | "none";
  escalationMessage: string;
  // Voz
  voiceReplyEnabled: boolean;
  voiceId: string;
}

export const DEFAULT_WHATSAPP_CONFIG: TenantWhatsAppConfig = {
  tone: "amable",
  businessHours: "09:00-18:00",
  knowledgeBase: "",
  autoReplyEnabled: true,
  preferLocalAi: false,
  maxTokensResponse: 500,
  escalationKeywords: ["humano", "persona", "agente", "reclamo", "queja"],
  escalationNotify: "none",
  escalationMessage: "Un agente humano se pondra en contacto contigo en breve.",
  voiceReplyEnabled: false,
  voiceId: "21m00Tcm4TlvDq8ikWAM",
};

export function mergeWhatsAppConfig(
  stored: Record<string, unknown> | null
): TenantWhatsAppConfig {
  if (!stored) return DEFAULT_WHATSAPP_CONFIG;
  return {
    ...DEFAULT_WHATSAPP_CONFIG,
    ...stored,
    tone: stored.tone ?? DEFAULT_WHATSAPP_CONFIG.tone,
    escalationNotify: stored.escalationNotify ?? DEFAULT_WHATSAPP_CONFIG.escalationNotify,
  } as TenantWhatsAppConfig;
}

/**
 * Placeholder for E3.2: load a tenant's WhatsApp config (including KB) from
 * persistence. Until E3.2 lands, returns the defaults merged with any stored
 * channel config when it can be read; never throws.
 */
export async function loadTenantWhatsAppConfig(
  tenantId: string,
  tx?: Prisma.TransactionClient
): Promise<TenantWhatsAppConfig> {
  if (!tenantId) return DEFAULT_WHATSAPP_CONFIG;
  try {
    let channel: { config?: unknown } | null = null;
    if (tx) {
      channel = await (tx as any)?.tenantChannel?.findUnique?.({
        where: { tenantId_channel: { tenantId, channel: "whatsapp_text" } },
      });
    } else {
      channel = await withTenant(tenantId, async (scopedTx) => {
        return (scopedTx as any)?.tenantChannel?.findUnique?.({
          where: { tenantId_channel: { tenantId, channel: "whatsapp_text" } },
        });
      });
    }
    const stored = (channel?.config ?? null) as Record<string, unknown> | null;
    return mergeWhatsAppConfig(stored);
  } catch {
    return DEFAULT_WHATSAPP_CONFIG;
  }
}

export const getTenantWhatsAppConfig = loadTenantWhatsAppConfig;

export function isWithinBusinessHours(businessHours: string): boolean {
  if (!businessHours || !businessHours.includes("-")) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startStr, endStr] = businessHours.split("-");
  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}