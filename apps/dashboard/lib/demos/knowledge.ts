import { DEFAULT_WHATSAPP_CONFIG, type TenantWhatsAppConfig } from "@/lib/whatsapp/config";
import type { DemoRubro } from "@/lib/demos/schema";
import {
  applyGuardrails as applyTenantGuardrails,
  isInjection as isInjectionGuard,
  normalize as normalizeGuard,
  NO_DATA_REPLY,
  MONEY_REGEXES,
  DOLLAR_AMOUNT,
  WORD_AMOUNT,
  WORD_BEFORE_AMOUNT,
  CURRENCY_BEFORE_AMOUNT,
} from "@/lib/knowledge/guardrails";

const NO_DATA_FALLBACK = NO_DATA_REPLY;

/**
 * Demo knowledge base and guardrails for the public live chat (SRD M7: "base de
 * conocimiento y guardarraíles"). The facts below come only from the §5.2 scripts
 * of the source plan — nothing is invented outside that table. Every string is
 * Chilean-neutral tuteo (ruling R25 / §10.1): never voseo, no unexplained jargon.
 */
export interface DemoBusiness {
  id: DemoRubro;
  /** Chip label of the demo rubro. */
  label: string;
  /** Demo business name shown in the chat header. */
  businessName: string;
  /** Facts the model is allowed to cite — and nothing else. */
  knowledgeBase: string;
  /** First assistant bubble when the chat opens. */
  greeting: string;
  /** Three suggested questions the visitor can tap. */
  suggestions: string[];
  /** Canonical reply when the price / human-handoff guardrail fires. */
  deflection: string;
}

export const DEMO_BUSINESSES: Record<DemoRubro, DemoBusiness> = {
  peluqueria: {
    id: "peluqueria",
    label: "Peluquería",
    businessName: "Peluquería Aurora (demo)",
    knowledgeBase:
      "Peluquería de ejemplo. Atendemos de lunes a sábado y los mensajes llegan a cualquier hora, incluso con el salón cerrado. Servicios: corte, corte y barba, peinado. Para agendar pedimos el nombre y el servicio. El sábado hay horas por la tarde, por ejemplo 15:30 y 17:00. Confirmamos la hora y enviamos un recordatorio el día anterior.",
    greeting:
      "¡Hola! Soy la asistente virtual de esta peluquería de ejemplo. Cuéntame qué necesitas y te ayudo a agendar una hora.",
    suggestions: [
      "¿Tienen hora para el sábado en la tarde?",
      "Quiero corte y barba",
      "¿Atienden fuera de horario?",
    ],
    deflection:
      "El valor lo confirmamos al agendar la hora, nunca por este chat. ¿Te reservo una hora y una persona del salón te confirma el detalle?",
  },
  taller: {
    id: "taller",
    label: "Taller",
    businessName: "Taller Ruta Sur (demo)",
    knowledgeBase:
      "Taller mecánico de ejemplo. Revisamos el auto antes de confirmar cualquier trabajo. El valor exacto lo confirma el taller al revisar el vehículo: por ejemplo, el cambio de pastillas de freno de un Corolla 2015 se cotiza en la revisión. Agendamos revisiones, por ejemplo el lunes a las 9:00 o a las 11:00. No confirmamos precios ni presupuestos por este canal.",
    greeting:
      "¡Hola! Soy la asistente virtual de este taller de ejemplo. Cuéntame qué necesita tu auto y vemos una revisión.",
    suggestions: [
      "¿Puedo agendar una revisión?",
      "¿Revisan las pastillas de freno?",
      "¿Qué días atienden?",
    ],
    deflection:
      "El valor exacto lo confirma el taller al revisar el auto. Puedo agendarte una revisión el lunes a las 9:00 o a las 11:00. ¿Cuál te acomoda?",
  },
  profesionales: {
    id: "profesionales",
    label: "Servicios profesionales",
    businessName: "Estudio Jurídico Sur (demo)",
    knowledgeBase:
      "Estudio jurídico de ejemplo. Damos una primera consulta para orientarte en temas laborales, por ejemplo un despido. No entregamos asesoría legal por este canal. La primera consulta la agendamos con una persona del estudio: esta semana hay miércoles o jueves.",
    greeting:
      "¡Hola! Soy la asistente virtual de este estudio de ejemplo. Cuéntame en qué te ayudo; si es un tema legal, te derivo con una persona.",
    suggestions: [
      "Necesito orientación por un despido",
      "¿Cuándo puedo tener una consulta?",
      "¿Atienden temas laborales?",
    ],
    deflection:
      "Lamento la situación. Por aquí no puedo dar asesoría, pero puedo agendarte una primera consulta con la abogada esta semana. ¿Te sirve el miércoles o el jueves?",
  },
  otro: {
    id: "otro",
    label: "Otro",
    businessName: "Negocio de barrio (demo)",
    knowledgeBase:
      "Negocio de barrio de ejemplo. Tomamos pedidos y consultas, y coordinamos visitas o entregas con una persona del equipo. No confirmamos precios ni horarios por este chat: todo se coordina con una persona.",
    greeting:
      "¡Hola! Soy la asistente virtual de este negocio de ejemplo. Cuéntame qué necesitas y te ayudo a coordinar.",
    suggestions: ["Quiero coordinar una visita", "¿Puedo dejar un encargo?", "¿Cómo me contactan?"],
    deflection:
      "No confirmamos precios por este chat. Una persona del equipo te contacta para coordinarlo. ¿Te sirve si te contactamos hoy?",
  },
};

/** Words that hand the conversation to a human instead of the model. */
export const DEMO_ESCALATION_KEYWORDS: string[] = [
  "humano",
  "persona",
  "agente",
  "abogado",
  "reclamo",
  "queja",
];

/**
 * Builds the synthetic `TenantWhatsAppConfig` of a demo rubro.
 *
 * `preferLocalAi` is `true` and `maxTokensResponse` is capped at 220 (ruling
 * R21/R19): the public demo may only run on the local model, with a hard output
 * bound so a single message can never balloon the cost.
 */
export function demoConfigFor(rubro: DemoRubro): TenantWhatsAppConfig {
  return {
    ...DEFAULT_WHATSAPP_CONFIG,
    tone: "amable",
    knowledgeBase: DEMO_BUSINESSES[rubro].knowledgeBase,
    preferLocalAi: true,
    maxTokensResponse: 220,
    escalationKeywords: DEMO_ESCALATION_KEYWORDS,
  };
}

/** Phrases that mean the visitor is asking for a price (ruling R20a). */
const PRICE_PATTERNS: string[] = [
  "precio",
  "cuanto sale",
  "cuanto cuesta",
  "cuanto vale",
  "valor",
  "tarifa",
  "presupuesto",
  "cotizacion",
  "cobran",
];

/**
 * True when the message is a price request. Such messages never reach the model:
 * they are answered with the rubro's canonical deflection so the demo can neither
 * spend tokens nor invent a figure (ruling R20a).
 */
export function isPriceRequest(message: string): boolean {
  const normalized = normalizeGuard(message);
  return PRICE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/**
 * True when the message tries to override or reveal the assistant's instructions.
 * Answered with the canonical deflection, never with the model (ruling R20c).
 */
export function isInjection(message: string): boolean {
  return isInjectionGuard(message);
}

/** Money figures the knowledge base genuinely contains, so they are not stripped. */
function allowedAmounts(knowledgeBase: string): Set<string> {
  const allowed = new Set<string>();
  const compact = (value: string) => value.toLowerCase().replace(/\s/g, "");

  for (const regex of MONEY_REGEXES) {
    const cloned = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : regex.flags + "g");
    for (const match of knowledgeBase.match(cloned) ?? []) {
      allowed.add(compact(match));
    }
  }

  return allowed;
}

export { DOLLAR_AMOUNT, WORD_AMOUNT, WORD_BEFORE_AMOUNT, CURRENCY_BEFORE_AMOUNT, MONEY_REGEXES };

/**
 * Post-filter (ruling R20b): removes any monetary figure from a generated reply
 * that is not present in the rubro's knowledge base, so the AI can never leak a
 * fabricated price. When stripping leaves no content, the canonical deflection is
 * returned instead of an empty bubble.
 */
export function applyGuardrails(reply: string, rubro: DemoRubro | string): string {
  // Consumer wrapper: resolve the demo business when a known rubro is passed,
  // otherwise treat the second argument as a raw knowledge base string.
  const business = (DEMO_BUSINESSES as Record<string, any>)[rubro as string];
  if (business) {
    return applyTenantGuardrails(reply, business.knowledgeBase, business.deflection);
  }
  return applyTenantGuardrails(reply, String(rubro ?? ""), NO_DATA_FALLBACK);
}
