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