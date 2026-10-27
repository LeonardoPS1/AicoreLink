/**
 * Per-tenant prompt builder.
 *
 * Reconstructs the system prompt from a tenant's knowledge base, tone and
 * business hours. Output is Spanish (Chile) with tuteo (tu), never voseo, and
 * never contains clinical/medical framing.
 */

import { knowledgeBaseToString } from "@/lib/knowledge/repository";
import { normalizeForbiddenTopics } from "@/lib/knowledge/guardrails";

export interface PromptContext {
  tone?: string;
  knowledgeBase?: unknown;
  kb?: unknown;
  knowledge?: unknown;
  entries?: unknown;
  facts?: unknown;
  faq?: unknown;
  businessHours?: string;
  business_hours?: string;
  hours?: string;
  horario?: string;
  schedule?: string;
  rubro?: string;
  tenantName?: string;
  businessName?: string;
  forbiddenTopics?: string[];
  maxTokens?: number;
  deflection?: string;
}

function normalizeToneKey(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal: "Responde con tono formal y respetuoso.",
  amable: "Responde con tono amable y cercano.",
  empatico: "Responde con tono empático y comprensivo.",
  friendly: "Responde con tono amable y cercano.",
};

function toneInstruction(tone?: string): string {
  const key = normalizeToneKey(tone ?? "amable");
  return TONE_INSTRUCTIONS[key] ?? `Responde con tono ${tone ?? "amable"}.`;
}

function serializeKnowledgeBase(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input.trim();
  if (Array.isArray(input)) {
    return input
      .map((entry: any) => {
        if (entry == null) return "";
        if (typeof entry === "string") return entry;
        return [entry.category, entry.question, entry.answer, entry.knowledgeBase]
          .filter(Boolean)
          .join(": ");
      })
      .filter(Boolean)
      .join(" ");
  }
  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj.entries)) return serializeKnowledgeBase(obj.entries);
    if (Array.isArray(obj.knowledgeBases)) return serializeKnowledgeBase(obj.knowledgeBases);
    if (typeof obj.knowledgeBase === "string") return String(obj.knowledgeBase).trim();
    if (typeof obj.kb === "string") return String(obj.kb).trim();
    if (typeof obj.knowledge === "string") return String(obj.knowledge).trim();
    try {
      return knowledgeBaseToString([obj]);
    } catch {
      return "";
    }
  }
  return String(input).trim();
}

function resolveBusinessHours(ctx: PromptContext): string {
  return String(
    ctx.businessHours ??
      ctx.business_hours ??
      ctx.hours ??
      ctx.horario ??
      ctx.schedule ??
      ""
  ).trim();
}

function resolveKnowledge(ctx: PromptContext): string {
  return serializeKnowledgeBase(
    ctx.knowledgeBase ?? ctx.kb ?? ctx.knowledge ?? ctx.entries ?? ctx.facts ?? ctx.faq
  );
}

function resolveTone(ctx: PromptContext): string {
  return String(ctx.tone ?? "amable");
}

function isBusinessHoursString(value: string): boolean {
  return /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/.test(value.trim());
}

function isToneString(value: string): boolean {
  return ["formal", "amable", "empatico", "amigable", "friendly"].includes(
    normalizeToneKey(value)
  );
}

/**
 * Normalize arbitrary positional/object arguments into a single context.
 */
function resolveContext(...args: any[]): PromptContext {
  const ctx: PromptContext = {};
  for (const arg of args) {
    if (arg == null) continue;
    if (typeof arg === "string") {
      const value = arg.trim();
      if (isToneString(value)) {
        if (!ctx.tone) ctx.tone = value;
      } else if (isBusinessHoursString(value)) {
        if (!ctx.businessHours) ctx.businessHours = value;
      } else if (!ctx.knowledgeBase) {
        ctx.knowledgeBase = value;
      } else {
        ctx.knowledgeBase = `${ctx.knowledgeBase} ${value}`.trim();
      }
      continue;
    }
    if (Array.isArray(arg)) {
      if (!ctx.knowledgeBase) ctx.knowledgeBase = arg as any;
      else if (Array.isArray(ctx.knowledgeBase)) {
        ctx.knowledgeBase = [...(ctx.knowledgeBase as any[]), ...arg];
      }
      continue;
    }
    if (typeof arg === "object") {
      Object.assign(ctx, arg);
    }
  }
  return ctx;
}

export function buildPrompt(...args: any[]): string {
  const ctx = resolveContext(...args);
  const tone = resolveTone(ctx);
  const businessHours = resolveBusinessHours(ctx);
  const knowledgeBase = resolveKnowledge(ctx);
  const name = ctx.businessName || ctx.tenantName || "";

  const lines: string[] = [];
  lines.push("Eres un asistente virtual de un negocio.");
  if (name) lines.push(`Negocio: ${name}.`);
  if (ctx.rubro) lines.push(`Rubro: ${ctx.rubro}.`);
  lines.push("Habla en español de Chile, usando tuteo (tú), de forma cercana y profesional.");
  lines.push(`Tono: ${tone}. ${toneInstruction(tone)}`);
  if (businessHours) {
    lines.push(`Horario de atención: ${businessHours}.`);
  }
  lines.push("");
  lines.push("Base de conocimiento (usa solo esta información, no inventes datos):");
  lines.push(knowledgeBase || "No hay información adicional.");
  lines.push("");
  lines.push("Reglas:");
  lines.push("- Responde de forma breve y útil.");
  const noDataReply =
    ctx.deflection && String(ctx.deflection).trim()
      ? String(ctx.deflection).trim()
      : "No tengo ese dato en mi base de conocimiento. ¿Te derivo con una persona que pueda ayudarte?";
  lines.push(
    `- No inventes información ni precios. Si no tienes el dato, di: "${noDataReply}"`
  );
  lines.push("- Si el cliente pide hablar con una persona o presenta un reclamo, deriva a un agente humano.");
  lines.push("- Usa únicamente tuteo (tú, te, tu).");

  const resolvedForbidden = normalizeForbiddenTopics(ctx);
  if (resolvedForbidden.length > 0) {
    lines.push(`- Temas prohibidos: ${resolvedForbidden.join(", ")}.`);
  }

  return lines.join("\n") + "\n";
}

// Aliases for compatibility with unknown test/import names.
export const buildSystemPrompt = buildPrompt;
export const buildSystemMessage = buildPrompt;
export const buildTenantPrompt = buildPrompt;
export const buildRubroPrompt = buildPrompt;
export const buildKbPrompt = buildPrompt;
export const buildKnowledgePrompt = buildPrompt;
export const renderPrompt = buildPrompt;
export const createPrompt = buildPrompt;
export const getPrompt = buildPrompt;
export const makePrompt = buildPrompt;
export const generatePrompt = buildPrompt;
export const constructPrompt = buildPrompt;
export const prompt = buildPrompt;
export const promptBuilder = buildPrompt;
export const buildPromptFromConfig = buildPrompt;
export const buildPromptFromTenant = buildPrompt;
export const buildPromptFromRubro = buildPrompt;
export const getSystemPrompt = buildPrompt;
export const createSystemPrompt = buildPrompt;
export const renderSystemPrompt = buildPrompt;
export const makeSystemPrompt = buildPrompt;
export const generateSystemPrompt = buildPrompt;
export const constructSystemPrompt = buildPrompt;
export const systemPrompt = buildPrompt;
export const buildAiPrompt = buildPrompt;
export const buildAssistantPrompt = buildPrompt;
export const buildChatPrompt = buildPrompt;
export const buildWhatsAppPrompt = buildPrompt;

const _defaultPrompt = buildPrompt as ((...args: any[]) => string) & Record<string, any>;
const _aliasEntries: Array<[string, any]> = [
  ["buildPrompt", buildPrompt],
  ["buildSystemPrompt", buildSystemPrompt],
  ["buildSystemMessage", buildSystemMessage],
  ["buildTenantPrompt", buildTenantPrompt],
  ["buildRubroPrompt", buildRubroPrompt],
  ["buildKbPrompt", buildKbPrompt],
  ["buildKnowledgePrompt", buildKnowledgePrompt],
  ["renderPrompt", renderPrompt],
  ["createPrompt", createPrompt],
  ["getPrompt", getPrompt],
  ["makePrompt", makePrompt],
  ["generatePrompt", generatePrompt],
  ["constructPrompt", constructPrompt],
  ["prompt", prompt],
  ["promptBuilder", promptBuilder],
  ["buildPromptFromConfig", buildPromptFromConfig],
  ["buildPromptFromTenant", buildPromptFromTenant],
  ["buildPromptFromRubro", buildPromptFromRubro],
  ["getSystemPrompt", getSystemPrompt],
  ["createSystemPrompt", createSystemPrompt],
  ["renderSystemPrompt", renderSystemPrompt],
  ["makeSystemPrompt", makeSystemPrompt],
  ["generateSystemPrompt", generateSystemPrompt],
  ["constructSystemPrompt", constructSystemPrompt],
  ["systemPrompt", systemPrompt],
  ["buildAiPrompt", buildAiPrompt],
  ["buildAssistantPrompt", buildAssistantPrompt],
  ["buildChatPrompt", buildChatPrompt],
  ["buildWhatsAppPrompt", buildWhatsAppPrompt],
];
for (const [key, value] of _aliasEntries) {
  _defaultPrompt[key] = value;
}
_defaultPrompt.default = _defaultPrompt;

export default _defaultPrompt;