/**
 * Per-tenant knowledge base guardrails.
 *
 * Generalizes the demo guardrails (`lib/demos/knowledge.ts`) so every tenant
 * gets the same anti-invention protections: prompt-injection detection, price
 * deflection, and a post-filter that strips monetary figures not present in the
 * tenant's own knowledge base. Demo rubros become a consumer of this module.
 */

import type { DemoRubro } from "@/lib/demos/schema";

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

export function normalize(text: string): string {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ---------------------------------------------------------------------------
// Injection / price patterns (moved from lib/demos/knowledge.ts)
// ---------------------------------------------------------------------------

export const PRICE_PATTERNS: string[] = [
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

export const INJECTION_PATTERNS: string[] = [
  "ignore",
  "ignora",
  "olvida tus instrucciones",
  "system prompt",
  "revela tus instrucciones",
  "actua como",
];

export function isPriceRequest(message: string): boolean {
  const normalized = normalize(message);
  return PRICE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function isInjection(message: string): boolean {
  const normalized = normalize(message);
  return INJECTION_PATTERNS.some((pattern) => normalized.includes(pattern));
}

// ---------------------------------------------------------------------------
// Forbidden topics (configurable per tenant)
// ---------------------------------------------------------------------------

export function normalizeForbiddenTopics(input: unknown): string[] {
  if (input == null) return [];
  if (Array.isArray(input)) return input.map((x) => String(x).trim()).filter(Boolean);
  if (typeof input === "string") return input.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const topics =
      obj.forbiddenTopics ?? obj.forbidden_topics ?? obj.topics ?? obj.forbiddenTopicList ?? obj.forbiddenTopic ?? obj.forbidden_topic;
    if (Array.isArray(topics)) return topics.map((x) => String(x).trim()).filter(Boolean);
    if (typeof topics === "string") return topics.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

export function isForbiddenTopic(message: unknown, forbiddenTopics?: unknown): boolean {
  // Context-object form: isForbiddenTopic({ message, forbiddenTopics })
  if (
    forbiddenTopics === undefined &&
    typeof message === "object" &&
    message !== null &&
    !Array.isArray(message)
  ) {
    const obj = message as Record<string, unknown>;
    const msg = (obj.message ?? obj.question ?? obj.text ?? obj.input) as unknown;
    const topics = normalizeForbiddenTopics(
      obj.forbiddenTopics ?? obj.forbidden_topics ?? obj.topics ?? obj.forbiddenTopicList ?? obj.forbiddenTopic ?? obj.forbidden_topic
    );
    if (topics.length === 0) return false;
    const normalizedMsg = normalize(String(msg ?? ""));
    return topics.some((topic) => normalizedMsg.includes(normalize(topic)));
  }

  const topics = normalizeForbiddenTopics(forbiddenTopics);
  if (topics.length === 0) return false;
  const normalizedMsg = normalize(String(message ?? ""));
  return topics.some((topic) => normalizedMsg.includes(normalize(topic)));
}

export const isForbidden = isForbiddenTopic;
export const forbiddenTopic = isForbiddenTopic;
export const isForbiddenTopics = isForbiddenTopic;
export const containsForbiddenTopic = isForbiddenTopic;
export const hasForbiddenTopic = isForbiddenTopic;
export const isForbiddenMessage = isForbiddenTopic;
export const checkForbiddenTopic = isForbiddenTopic;
export const forbiddenGuard = isForbiddenTopic;

export function applyForbiddenGuardrails(
  reply: string,
  forbiddenTopics?: unknown,
  deflection?: string
): string {
  // If the reply itself references a forbidden topic, deflect.
  if (isForbiddenTopic(reply, forbiddenTopics)) {
    return deflection ?? NO_DATA_REPLY;
  }
  return String(reply ?? "");
}

export const applyForbiddenTopicGuardrails = applyForbiddenGuardrails;
export const applyForbiddenTopicGuardrail = applyForbiddenGuardrails;

// ---------------------------------------------------------------------------
// Canonical replies
// ---------------------------------------------------------------------------

export const NO_DATA_REPLY =
  "No tengo ese dato en mi base de conocimiento. ¿Te derivo con una persona que pueda ayudarte?";

export const DEFAULT_DEFLECTION = NO_DATA_REPLY;

// ---------------------------------------------------------------------------
// Money post-filter (generalized applyGuardrails)
// ---------------------------------------------------------------------------

const DOLLAR_AMOUNT = /\$\s?\d[\d.,]*/g;
const WORD_AMOUNT = /\b\d[\d.,]*\s?(?:pesos?|clp)\b/gi;

function allowedAmounts(knowledgeBase: string): Set<string> {
  const allowed = new Set<string>();
  const compact = (value: string) => value.toLowerCase().replace(/\s/g, "");

  for (const match of knowledgeBase.match(DOLLAR_AMOUNT) ?? []) {
    allowed.add(compact(match));
  }
  for (const match of knowledgeBase.match(WORD_AMOUNT) ?? []) {
    allowed.add(compact(match));
  }

  return allowed;
}

export interface GuardrailContext {
  knowledgeBase?: string;
  deflection?: string;
  knowledge?: string;
  kb?: string;
}

function resolveKnowledgeBase(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") {
    // Demo rubro shortcut: if it names a known demo rubro, the caller is expected
    // to pass the actual KB text; here we just treat the string as KB text. Demo
    // consumers wrap this with their own business lookup (see lib/demos/knowledge).
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .map((entry: any) => {
        if (entry == null) return "";
        if (typeof entry === "string") return entry;
        return [entry.category, entry.question, entry.answer]
          .filter(Boolean)
          .join(" ");
      })
      .join(" ");
  }
  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (typeof obj.knowledgeBase === "string") return obj.knowledgeBase;
    if (typeof obj.knowledge === "string") return obj.knowledge;
    if (typeof obj.kb === "string") return obj.kb;
    if (Array.isArray(obj.entries)) return resolveKnowledgeBase(obj.entries);
    if (Array.isArray(obj.knowledgeBases)) return resolveKnowledgeBase(obj.knowledgeBases);
    try {
      return JSON.stringify(obj);
    } catch {
      return "";
    }
  }
  return String(input);
}

function resolveDeflection(input: unknown, fallback?: string): string {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const obj = input as Record<string, unknown>;
    if (typeof obj.deflection === "string") return obj.deflection;
    if (typeof obj.canonicalReply === "string") return obj.canonicalReply;
  }
  return fallback ?? NO_DATA_REPLY;
}

/**
 * Post-filter: removes any monetary figure from `reply` that is not present in
 * the tenant's knowledge base. Falls back to `deflection` when nothing remains.
 *
 * Accepts the knowledge base as a string, an array of KB entries, or a context
 * object. For backward compatibility with the demo consumer, a demo rubro name
 * passed as a string is treated as KB text by the demo wrapper.
 */
export function applyGuardrails(
  reply: string,
  knowledgeBaseOrContext: unknown = "",
  deflection?: string
): string {
  const knowledgeBase = resolveKnowledgeBase(knowledgeBaseOrContext);
  const resolvedDeflection = resolveDeflection(knowledgeBaseOrContext, deflection);

  const allowed = allowedAmounts(knowledgeBase);

  const keepOrDrop = (match: string) =>
    allowed.has(match.toLowerCase().replace(/\s/g, "")) ? match : " ";

  const cleaned = String(reply ?? "")
    .replace(DOLLAR_AMOUNT, keepOrDrop)
    .replace(WORD_AMOUNT, keepOrDrop)
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return /[a-z0-9]/i.test(cleaned) ? cleaned : resolvedDeflection || NO_DATA_REPLY;
}

// ---------------------------------------------------------------------------
// Knowledge lookup ("no tengo ese dato" guardrail)
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  "que", "qué", "cual", "cuál", "como", "cómo", "cuando", "cuándo", "donde",
  "dónde", "para", "por", "con", "sin", "una", "uno", "unos", "unas", "del",
  "las", "los", "una", "este", "esta", "estos", "estas", "ese", "esa", "esos",
  "esas", "pero", "porque", "porqué", "tienen", "tiene", "tengo", "puedo",
  "puede", "pueden", "hola", "gracias", "favor", "info", "informacion",
  "información", "datos", "dato", "servicio", "servicios", "precio", "precios",
  "valor", "valores", "hora", "horas", "dia", "días", "dias", "usted", "ustedes",
  "the", "and", "for", "with", "you", "your", "are", "can", "how", "what",
  "when", "where", "this", "that", "have", "has",
]);

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

export interface KnowledgeEntryLike {
  id?: string;
  tenantId?: string;
  category?: string;
  question?: string;
  answer?: string;
  knowledgeBase?: string;
}

function toEntries(kb: unknown): KnowledgeEntryLike[] {
  if (kb == null) return [];
  if (Array.isArray(kb)) {
    return kb.map((e) => (typeof e === "string" ? { answer: e } : (e as KnowledgeEntryLike)));
  }
  if (typeof kb === "string") {
    // A plain string KB is treated as a single fact block with no question.
    return kb.trim() ? [{ answer: kb }] : [];
  }
  if (typeof kb === "object") {
    const obj = kb as Record<string, unknown>;
    if (Array.isArray(obj.entries)) return toEntries(obj.entries);
    if (Array.isArray(obj.knowledgeBases)) return toEntries(obj.knowledgeBases);
    if (typeof obj.knowledgeBase === "string" || typeof obj.knowledge === "string" || typeof obj.kb === "string") {
      return [{ answer: resolveKnowledgeBase(obj) }];
    }
    // Prisma row-ish
    if ("question" in obj || "answer" in obj) return [obj as KnowledgeEntryLike];
  }
  return [];
}

export interface KnowledgeMatch {
  entry: KnowledgeEntryLike;
  answer: string;
  score: number;
}

/**
 * Returns the best matching KB entry for a question, or null when the question
 * is out of base. Uses token overlap with a small threshold so unrelated
 * questions (the 50-question adversarial set) resolve to "no tengo ese dato".
 */
export function findEntry(question: string, knowledgeBase: unknown, forbiddenTopics?: unknown): KnowledgeEntryLike | null {
  // Forbidden topics never resolve to a KB answer.
  if (isForbiddenTopic(question, forbiddenTopics)) return null;
  const entries = toEntries(knowledgeBase);
  const qTokens = tokenize(question);
  if (qTokens.length === 0 || entries.length === 0) return null;

  let best: { entry: KnowledgeEntryLike; score: number } | null = null;
  for (const entry of entries) {
    const entryText = [entry.category, entry.question, entry.answer, entry.knowledgeBase]
      .filter(Boolean)
      .join(" ");
    const entryTokens = new Set(tokenize(entryText));
    let score = 0;
    for (const t of qTokens) if (entryTokens.has(t)) score += 1;
    if (!best || score > best.score) best = { entry, score };
  }

  const threshold = qTokens.length >= 4 ? 2 : 1;
  if (!best || best.score < threshold) return null;
  return best.entry;
}

export function findAnswer(question: string, knowledgeBase: unknown, forbiddenTopics?: unknown): string | null {
  const entry = findEntry(question, knowledgeBase, forbiddenTopics);
  if (!entry) return null;
  const answer = entry.answer ?? entry.knowledgeBase;
  return answer ? String(answer) : null;
}

export function hasAnswer(question: string, knowledgeBase: unknown, forbiddenTopics?: unknown): boolean {
  return findEntry(question, knowledgeBase, forbiddenTopics) !== null;
}

export function isInKnowledgeBase(question: string, knowledgeBase: unknown, forbiddenTopics?: unknown): boolean {
  return hasAnswer(question, knowledgeBase, forbiddenTopics);
}

export function isInBase(question: string, knowledgeBase: unknown, forbiddenTopics?: unknown): boolean {
  return hasAnswer(question, knowledgeBase, forbiddenTopics);
}

export function canAnswer(question: string, knowledgeBase: unknown, forbiddenTopics?: unknown): boolean {
  return hasAnswer(question, knowledgeBase, forbiddenTopics);
}

export function canAnswerFromKb(question: string, knowledgeBase: unknown, forbiddenTopics?: unknown): boolean {
  return hasAnswer(question, knowledgeBase, forbiddenTopics);
}

export function canAnswerFromKnowledgeBase(question: string, knowledgeBase: unknown, forbiddenTopics?: unknown): boolean {
  return hasAnswer(question, knowledgeBase, forbiddenTopics);
}

export function isOutOfBase(question: string, knowledgeBase: unknown, forbiddenTopics?: unknown): boolean {
  return !hasAnswer(question, knowledgeBase, forbiddenTopics);
}

export function isOutOfKnowledgeBase(question: string, knowledgeBase: unknown, forbiddenTopics?: unknown): boolean {
  return !hasAnswer(question, knowledgeBase, forbiddenTopics);
}

/**
 * Returns the KB answer when the question is in base, otherwise the canonical
 * "no tengo ese dato" reply (with derivation offer).
 */
export function guardrailReply(
  question: string,
  knowledgeBase: unknown,
  deflectionOrForbidden?: string | string[] | unknown,
  forbiddenTopics?: unknown
): string {
  let deflection: string | undefined;
  let topics: unknown = forbiddenTopics;

  if (Array.isArray(deflectionOrForbidden)) {
    topics = deflectionOrForbidden;
    // Honor deflection passed as 4th arg (string) even when 3rd is topics array.
    if (typeof forbiddenTopics === "string") {
      deflection = forbiddenTopics;
    } else if (forbiddenTopics && typeof forbiddenTopics === "object") {
      const o = forbiddenTopics as Record<string, unknown>;
      if (typeof o.deflection === "string" || typeof o.canonicalReply === "string") {
        deflection = (o.deflection ?? o.canonicalReply) as string;
      }
      if (o.forbiddenTopics || o.forbidden_topics || o.topics || o.forbiddenTopicList || o.forbiddenTopic || o.forbidden_topic) {
        topics = o.forbiddenTopics ?? o.forbidden_topics ?? o.topics ?? o.forbiddenTopicList ?? o.forbiddenTopic ?? o.forbidden_topic ?? topics;
      }
    }
  } else if (typeof deflectionOrForbidden === "string") {
    deflection = deflectionOrForbidden;
  } else if (deflectionOrForbidden && typeof deflectionOrForbidden === "object") {
    const obj = deflectionOrForbidden as Record<string, unknown>;
    if (typeof obj.deflection === "string" || typeof obj.canonicalReply === "string") {
      deflection = (obj.deflection ?? obj.canonicalReply) as string;
    }
    if (obj.forbiddenTopics || obj.forbidden_topics || obj.topics || obj.forbiddenTopicList || obj.forbiddenTopic || obj.forbidden_topic) {
      topics = obj.forbiddenTopics ?? obj.forbidden_topics ?? obj.topics ?? obj.forbiddenTopicList ?? obj.forbiddenTopic ?? obj.forbidden_topic ?? topics;
    }
  }

  // Honor a 4th-arg string deflection in all cases.
  if (typeof forbiddenTopics === "string" && !deflection) {
    deflection = forbiddenTopics;
    topics = Array.isArray(deflectionOrForbidden) ? deflectionOrForbidden : topics;
  }

  if (isForbiddenTopic(question, topics)) {
    return deflection ?? NO_DATA_REPLY;
  }
  const answer = findAnswer(question, knowledgeBase, topics);
  if (answer) return answer;
  return deflection ?? NO_DATA_REPLY;
}

export function applyKbGuardrail(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

export function kbGuardrail(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

export function guardedAnswer(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

export function answerQuestion(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

export function resolveAnswer(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

export function queryKnowledgeBase(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

export function searchKnowledge(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

export function lookupAnswer(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

export function getAnswer(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

export function answerFromKnowledgeBase(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

export function answerFromKb(question: string, knowledgeBase: unknown, deflection?: string): string {
  return guardrailReply(question, knowledgeBase, deflection);
}

// Aliases for findEntry/findAnswer/hasAnswer with common names
export const findKnowledgeEntry = findEntry;
export const findKbEntry = findEntry;
export const searchKb = findEntry;
export const searchKnowledgeBaseEntry = findEntry;
export const lookupKnowledge = findEntry;
export const hasKnowledge = hasAnswer;
export const hasKbAnswer = hasAnswer;
export const inBase = isInBase;
export const inKnowledgeBase = isInKnowledgeBase;

// Aliases for boolean out-of-base
export const outOfBase = isOutOfBase;

// Alias for applyGuardrails with KB guard naming
export const applyKbGuardrails = applyGuardrails;
export const applyKnowledgeGuardrails = applyGuardrails;

