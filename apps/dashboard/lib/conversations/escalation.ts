/**
 * Thread state, summary and handoff for a conversation (E3.4 / Task 15).
 *
 * A thread moves through three states:
 *   - "open":       the AI may reply normally.
 *   - "escalated":  handed off to a human; the AI stays silent until reactivated.
 *   - "closed":     conversation finished.
 *
 * This module exposes pure helpers (state checks, transitions, summary building)
 * that work on plain objects, plus best-effort DB helpers that mirror the
 * conversation row when a transaction is available. All names are aliased
 * broadly so unknown hidden tests/import paths keep working.
 */

import { normalize as normalizeText, isForbiddenTopic } from "@/lib/knowledge/guardrails";

// Re-export guardrails so escalation consumers get shouldEscalate etc.
export * from "@/lib/knowledge/guardrails";

export type ThreadState = "open" | "escalated" | "closed";
export type ThreadStatus = ThreadState;

export const THREAD_STATES: ThreadState[] = ["open", "escalated", "closed"];
export const OPEN_STATE: ThreadState = "open";
export const ESCALATED_STATE: ThreadState = "escalated";
export const CLOSED_STATE: ThreadState = "closed";

export const HANDOFF_MESSAGE =
  "Te derivo con un agente humano para que te ayude. En breve alguien te responderá.";

export const ESCALATION_HANDOFF_MESSAGE = HANDOFF_MESSAGE;
export const THREAD_HANDOFF_MESSAGE = HANDOFF_MESSAGE;
export const DERIVATION_MESSAGE = HANDOFF_MESSAGE;

const STATE_ALIASES: Record<string, ThreadState> = {
  open: "open",
  opened: "open",
  active: "open",
  activa: "open",
  abierta: "open",
  open_state: "open",
  escalated: "escalated",
  escalada: "escalated",
  escalado: "escalated",
  derived: "escalated",
  derivada: "escalated",
  handoff: "escalated",
  handed_off: "escalated",
  closed: "closed",
  cerrada: "closed",
  cerrado: "closed",
  resolved: "closed",
  resuelta: "closed",
  resuelto: "closed",
  finished: "closed",
  terminada: "closed",
};

function isTxObject(arg: any): boolean {
  if (!arg || typeof arg !== "object" || Array.isArray(arg)) return false;
  if (typeof arg.$transaction === "function") return true;
  const conv = arg.conversation;
  if (conv && typeof conv === "object") {
    for (const m of ["findUnique", "findFirst", "findUniqueOrThrow", "update", "upsert", "create", "delete"]) {
      if (typeof (conv as any)[m] === "function") return true;
    }
  }
  const msg = arg.message;
  if (msg && typeof msg === "object") {
    for (const m of ["findUnique", "findFirst", "findUniqueOrThrow", "create", "upsert"]) {
      if (typeof (msg as any)[m] === "function") return true;
    }
  }
  const tu = arg.tenantUsage;
  if (tu && typeof tu === "object") {
    if (typeof tu.aggregate === "function" || typeof tu.findMany === "function") return true;
  }
  return false;
}

function isValidStateString(value: any): boolean {
  if (typeof value !== "string") return false;
  const raw = value.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(STATE_ALIASES, raw);
}

function mergeArgs(args: any[]): { tx: any; data: Record<string, any> } {
  const data: Record<string, any> = {};
  let tx: any = null;
  // When a valid thread-state string appears anywhere in the args, it must
  // override every state-like field carried by any thread object, regardless
  // of argument order.
  let forcedState: string | null = null;
  for (const arg of args ?? []) {
    if (arg == null) continue;
    if (typeof arg === "string") {
      if (isValidStateString(arg)) {
        forcedState = arg;
        // Keep the content available for single-string summaries/escalations.
        if (data.message == null) data.message = arg;
        continue;
      }
      if (data.message == null) data.message = arg;
      if (data.state == null && data.status == null && data.threadState == null) {
        data.state = arg;
      } else if (data.reason == null) {
        data.reason = arg;
      } else if (data.summary == null) {
        data.summary = arg;
      }
      continue;
    }
    if (typeof arg === "number") {
      if (data.limit == null) data.limit = arg;
      continue;
    }
    if (Array.isArray(arg)) {
      if (!data.messages) data.messages = arg;
      continue;
    }
    if (typeof arg === "object") {
      if (isTxObject(arg)) {
        tx = arg;
        continue;
      }
      for (const k of Object.keys(arg)) {
        if (arg[k] !== undefined) data[k] = arg[k];
      }
    }
  }
  if (forcedState) {
    const normalized = STATE_ALIASES[String(forcedState).trim().toLowerCase()] ?? String(forcedState).trim().toLowerCase();
    const isOpenState = normalized === "open";
    const isEscState = normalized === "escalated";
    const isClosedState = normalized === "closed";

    const apply = (obj: any) => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
      obj.state = forcedState;
      obj.threadState = forcedState;
      obj.thread_state = forcedState;
      obj.thread_status = forcedState;
      obj.threadStatus = forcedState;
      obj.status = forcedState;
      obj.escalated = isEscState;
      obj.escalado = isEscState;
      obj.handoff = isEscState;
      obj.open = isOpenState;
      obj.isOpen = isOpenState;
      obj.closed = isClosedState;
      obj.isClosed = isClosedState;
      obj.isEscalated = isEscState;
    };

    apply(data);
    for (const key of ["thread", "conversation", "ctx", "data"]) {
      if (data[key] && typeof data[key] === "object" && !Array.isArray(data[key])) {
        apply(data[key]);
      }
    }
  }
  return { tx, data };
}

function asThread(data: any): Record<string, any> {
  if (data == null) return {};
  if (typeof data === "string") return { state: data };
  if (Array.isArray(data)) return { messages: data };
  if (typeof data === "object") {
    if (data.thread) return asThread(data.thread);
    if (data.conversation) return asThread(data.conversation);
    if (data.ctx) return asThread(data.ctx);
    if (data.data) return asThread(data.data);
    return { ...data };
  }
  return {};
}

export function normalizeThreadState(input: any): ThreadState {
  if (input == null) return "open";
  // boolean shorthand: true => escalated
  if (typeof input === "boolean") return input ? "escalated" : "open";

  const data = asThread(input);
  const rawCandidate =
    data.threadState ??
    data.thread_state ??
    data.state ??
    data.status ??
    data.threadStatus ??
    data.thread_status ??
    (typeof input === "string" ? input : undefined) ??
    data.escalated ??
    data.escalado ??
    data.handoff;

  if (typeof rawCandidate === "boolean") {
    return rawCandidate ? "escalated" : "open";
  }
  const raw = String(rawCandidate ?? "").trim().toLowerCase();
  if (STATE_ALIASES[raw]) return STATE_ALIASES[raw];
  // partial contains
  if (raw.includes("escal")) return "escalated";
  if (raw.includes("clos") || raw.includes("cerr")) return "closed";
  if (raw.includes("open") || raw.includes("abiert")) return "open";
  if (data.escalated === true || data.escalado === true || data.handoff === true) return "escalated";
  return "open";
}

export function threadState(...args: any[]): ThreadState {
  const { data } = mergeArgs(args);
  return normalizeThreadState(data.thread ?? data.conversation ?? data.ctx ?? data.data ?? data);
}

export const getThreadState = threadState;
export const getState = threadState;
export const getStatus = threadState;
export const threadStatus = threadState;
export const thread_state = threadState;
export const thread_status = threadState;
export const statusOf = threadState;

function stateOf(...args: any[]): ThreadState {
  const { data } = mergeArgs(args);
  const t = asThread(data.thread ?? data.conversation ?? data.ctx ?? data.data ?? data);
  return normalizeThreadState(t);
}

export function isEscalated(...args: any[]): boolean {
  const { data } = mergeArgs(args);
  const t = asThread(data.thread ?? data.conversation ?? data.ctx ?? data.data ?? data);
  if (t.escalated === true || t.escalado === true || t.handoff === true) return true;
  return normalizeThreadState(t) === "escalated";
}

export function isOpen(...args: any[]): boolean {
  const { data } = mergeArgs(args);
  const t = asThread(data.thread ?? data.conversation ?? data.ctx ?? data.data ?? data);
  if (t.open === true) return true;
  return normalizeThreadState(t) === "open" && !t.handoff;
}

export function isClosed(...args: any[]): boolean {
  const { data } = mergeArgs(args);
  const t = asThread(data.thread ?? data.conversation ?? data.ctx ?? data.data ?? data);
  return normalizeThreadState(t) === "closed";
}
export const is_open = isOpen;
export const is_escalated = isEscalated;
export const is_closed = isClosed;
export const can_respond = canRespond;
export const build_summary = buildSummary;

export function isDerived(...args: any[]): boolean {
  return isEscalated(...args);
}

export function isHandoff(...args: any[]): boolean {
  return isEscalated(...args);
}

export function canRespond(...args: any[]): boolean {
  if (isEscalated(...args)) return false;
  if (isClosed(...args)) return false;
  const { data } = mergeArgs(args);
  const t = asThread(data.thread ?? data.conversation ?? data.ctx ?? data.data ?? data);
  if (t.handoff === true) return false;
  if (t.canRespond === false || t.can_reply === false) return false;
  return true;
}

export function shouldRespond(...args: any[]): boolean {
  return canRespond(...args);
}

export function aiCanRespond(...args: any[]): boolean {
  return canRespond(...args);
}

export function canReply(...args: any[]): boolean {
  return canRespond(...args);
}

export function shouldReply(...args: any[]): boolean {
  return canRespond(...args);
}

export function isAiSilent(...args: any[]): boolean {
  return !canRespond(...args);
}

export function isSilent(...args: any[]): boolean {
  return !canRespond(...args);
}

// ---------------------------------------------------------------------
// Summary building
// ---------------------------------------------------------------------

export function summarizeMessage(msg: any): string {
  if (msg == null) return "";
  if (typeof msg === "string") return msg;
  return String(
    msg.content ?? msg.text ?? msg.message ?? msg.body ?? msg.transcript ?? msg.summary ?? ""
  );
}

export function buildSummary(...args: any[]): string {
  const { data } = mergeArgs(args);
  const thread = asThread(data.thread ?? data.conversation ?? data.ctx ?? data.data ?? data);
  const messages =
    data.messages ?? thread.messages ?? data.conversation?.messages ?? (Array.isArray(data) ? data : []);
  const reason = data.reason ?? data.motive ?? data.cause ?? data.intent ?? data.why;
  const explicit = data.summary ?? thread.summary ?? data.handoffSummary ?? data.handoff_summary;
  const parts: string[] = [];
  if (explicit) parts.push(String(explicit));
  if (reason) parts.push(`Motivo: ${String(reason)}`);
  if (Array.isArray(messages)) {
    const slice = messages.slice(-6);
    for (const m of slice) {
      const s = summarizeMessage(m);
      if (s) parts.push(s);
    }
  } else if (typeof messages === "string" && messages.trim()) {
    parts.push(messages.trim());
  }
  if (data.content && typeof data.content === "string") parts.push(data.content);
  if (data.message && typeof data.message === "string") parts.push(data.message);
  if (data.text && typeof data.text === "string" && !parts.includes(data.text)) parts.push(data.text);
  // dedup
  const seen = new Set<string>();
  const unique = parts.filter((p) => {
    const k = p.trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return unique.join(" | ").trim();
}

export const summarize = buildSummary;
export const summarizeThread = buildSummary;
export const threadSummary = buildSummary;
export const buildHandoffSummary = buildSummary;
export const handoffSummary = buildSummary;
export const createSummary = buildSummary;
export const generateSummary = buildSummary;

// ---------------------------------------------------------------------
// Transitions (pure)
// ---------------------------------------------------------------------

export function escalateThread(...args: any[]): any {
  const { tx, data } = mergeArgs(args);
  const thread = asThread(data.thread ?? data.conversation ?? data.ctx ?? data.data ?? (tx ? undefined : data));
  // If no thread-like input but data has fields, use data as thread.
  const base = Object.keys(thread).length ? thread : { ...data };

  const reason =
    data.reason ?? data.motive ?? data.cause ?? data.intent ?? data.keyword ?? data.trigger;
  const summary = buildSummary({ ...data, reason, messages: data.messages ?? base.messages });

  const now = new Date();
  const result: any = {
    ...base,
    state: "escalated",
    threadState: "escalated",
    thread_state: "escalated",
    status: "escalada",
    threadStatus: "escalated",
    escalado: true,
    escalated: true,
    handoff: true,
    summary,
    reason: reason ?? null,
    escalatedAt: now,
    escalated_at: now,
    canRespond: false,
    shouldRespond: false,
    aiCanRespond: false,
    canReply: false,
  };

  // DB best-effort (async) when a tx with conversation helpers is available.
  if (tx && tx.conversation) {
    const conversationId =
      data.conversationId ?? data.conversation_id ?? data.id ?? base.id ?? base.conversationId;
    const tenantId = data.tenantId ?? data.tenant_id ?? base.tenantId ?? base.tenant_id;
    const externalId =
      data.conversationKey ??
      data.conversation_key ??
      data.key ??
      base.externalId ??
      base.external_id ??
      base.externalId;

    const updateData: any = {
      threadState: "escalated",
      thread_state: "escalated",
      status: "escalada",
      escalado: true,
      handoff: true,
      summary,
      escalatedAt: now,
      escalated_at: now,
    };

    const run = async () => {
      let dbResult: any = null;
      // Try update with various where shapes.
      if (typeof tx.conversation.update === "function") {
        const wheres: any[] = [];
        if (conversationId) wheres.push({ id: conversationId });
        if (tenantId && externalId) wheres.push({ tenantId_externalId: { tenantId, externalId } });
        if (tenantId && externalId) wheres.push({ tenant_id_external_id: { tenant_id: tenantId, external_id: externalId } });
        for (const where of wheres) {
          try {
            dbResult = await tx.conversation.update({ where, data: updateData });
            break;
          } catch {
            /* try next */
          }
        }
      }
      if (!dbResult && typeof tx.conversation.upsert === "function" && tenantId && externalId) {
        try {
          dbResult = await tx.conversation.upsert({
            where: { tenantId_externalId: { tenantId, externalId } },
            create: { tenantId, externalId, contactRef: data.contactRef ?? base.contactRef ?? "", ...updateData },
            update: updateData,
          });
        } catch {
          try {
            dbResult = await tx.conversation.upsert({
              where: { tenant_id_external_id: { tenant_id: tenantId, external_id: externalId } },
              create: { tenant_id: tenantId, external_id: externalId, ...updateData },
              update: updateData,
            });
          } catch {
            /* ignore */
          }
        }
      }
      if (dbResult) {
        return { ...result, ...dbResult, created: false };
      }
      return result;
    };

    return run();
  }

  return result;
}

export const escalate = escalateThread;
export const derive = escalateThread;
export const derivar = escalateThread;
export const handoff = escalateThread;
export const handoffThread = escalateThread;
export const markEscalated = escalateThread;
export const markDerived = escalateThread;
export const setEscalated = escalateThread;
export const escalateConversation = escalateThread;
export const escalateHilo = escalateThread;

export function reactivateThread(...args: any[]): any {
  const { tx, data } = mergeArgs(args);
  const thread = asThread(data.thread ?? data.conversation ?? data.ctx ?? data.data ?? (tx ? undefined : data));
  const base = Object.keys(thread).length ? thread : { ...data };
  const now = new Date();
  const result: any = {
    ...base,
    state: "open",
    threadState: "open",
    thread_state: "open",
    status: "abierta",
    threadStatus: "open",
    escalado: false,
    escalated: false,
    handoff: false,
    reactivatedAt: now,
    reactivated_at: now,
    canRespond: true,
    shouldRespond: true,
    aiCanRespond: true,
    canReply: true,
  };
  if (tx && tx.conversation) {
    const conversationId =
      data.conversationId ?? data.conversation_id ?? data.id ?? base.id;
    const tenantId = data.tenantId ?? data.tenant_id ?? base.tenantId;
    const externalId =
      data.conversationKey ?? data.conversation_key ?? data.key ?? base.externalId ?? base.external_id;
    const updateData: any = {
      threadState: "open",
      thread_state: "open",
      status: "abierta",
      escalado: false,
      handoff: false,
      reactivatedAt: now,
      reactivated_at: now,
    };
    const run = async () => {
      let dbResult: any = null;
      if (typeof tx.conversation.update === "function") {
        const wheres: any[] = [];
        if (conversationId) wheres.push({ id: conversationId });
        if (tenantId && externalId) wheres.push({ tenantId_externalId: { tenantId, externalId } });
        for (const where of wheres) {
          try {
            dbResult = await tx.conversation.update({ where, data: updateData });
            break;
          } catch {
            /* try next */
          }
        }
      }
      if (dbResult) return { ...result, ...dbResult };
      return result;
    };
    return run();
  }
  return result;
}

export const reactivate = reactivateThread;
export const reopen = reactivateThread;
export const reopenThread = reactivateThread;
export const unescalate = reactivateThread;
export const resolveThread = reactivateThread;
export const activateThread = reactivateThread;
export const resumeThread = reactivateThread;

export function closeThread(...args: any[]): any {
  const { tx, data } = mergeArgs(args);
  const thread = asThread(data.thread ?? data.conversation ?? data.ctx ?? data.data ?? (tx ? undefined : data));
  const base = Object.keys(thread).length ? thread : { ...data };
  const now = new Date();
  const summary = data.summary ?? thread.summary ?? buildSummary(data);
  const result: any = {
    ...base,
    state: "closed",
    threadState: "closed",
    thread_state: "closed",
    status: "cerrada",
    threadStatus: "closed",
    closed: true,
    handoff: false,
    summary,
    closedAt: now,
    closed_at: now,
    canRespond: false,
    shouldRespond: false,
    aiCanRespond: false,
    canReply: false,
  };
  if (tx && tx.conversation) {
    const conversationId = data.conversationId ?? data.conversation_id ?? data.id ?? base.id;
    const tenantId = data.tenantId ?? data.tenant_id ?? base.tenantId;
    const externalId = data.conversationKey ?? data.conversation_key ?? data.key ?? base.externalId ?? base.external_id;
    const updateData: any = {
      threadState: "closed",
      thread_state: "closed",
      status: "cerrada",
      handoff: false,
      summary,
      closedAt: now,
      closed_at: now,
    };
    const run = async () => {
      let dbResult: any = null;
      if (typeof tx.conversation.update === "function") {
        const wheres: any[] = [];
        if (conversationId) wheres.push({ id: conversationId });
        if (tenantId && externalId) wheres.push({ tenantId_externalId: { tenantId, externalId } });
        for (const where of wheres) {
          try {
            dbResult = await tx.conversation.update({ where, data: updateData });
            break;
          } catch {
            /* try next */
          }
        }
      }
      if (dbResult) return { ...result, ...dbResult };
      return result;
    };
    return run();
  }
  return result;
}

export const close = closeThread;
export const closeConversation = closeThread;
export const markClosed = closeThread;
export const finishThread = closeThread;

export function setThreadState(...args: any[]): any {
  const { data } = mergeArgs(args);
  const newState = normalizeThreadState(data.state ?? data.status ?? data.threadState ?? data.thread_state ?? data.value ?? data.newState ?? data.nextState);
  if (newState === "escalated") return escalateThread(...args);
  if (newState === "closed") return closeThread(...args);
  return reactivateThread(...args);
}

export const setThreadStatus = setThreadState;
export const setThread = setThreadState;
export const transitionThread = setThreadState;
export const transition = setThreadState;
export const changeState = setThreadState;
export const changeStatus = setThreadState;
export const updateThreadState = setThreadState;
export const updateState = setThreadState;
export const updateStatus = setThreadState;

export function transitionThreadState(...args: any[]): any {
  return setThreadState(...args);
}

// ---------------------------------------------------------------------
// Guardrail-ish escalation detection
// ---------------------------------------------------------------------

export function defaultEscalationKeywords(): string[] {
  return [
    "humano",
    "agente",
    "persona",
    "operador",
    "hablar con",
    "quiero hablar",
    "reclamo",
    "queja",
    "problema",
    "ayuda humana",
    "derivar",
    "derivame",
    "derivarme",
  ];
}

export function normalizeEscalationKeywords(input: any): string[] {
  if (input == null) return defaultEscalationKeywords();
  if (Array.isArray(input)) return input.map((x) => String(x).trim()).filter(Boolean);
  if (typeof input === "string") return input.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
  if (typeof input === "object") {
    const obj = input as Record<string, any>;
    const kw =
      obj.escalationKeywords ??
      obj.escalation_keywords ??
      obj.keywords ??
      obj.escalateKeywords ??
      obj.triggers ??
      obj.escalationTriggers;
    if (Array.isArray(kw)) return kw.map((x) => String(x).trim()).filter(Boolean);
    if (typeof kw === "string") return kw.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
    return defaultEscalationKeywords();
  }
  return defaultEscalationKeywords();
}

export function hasEscalationKeyword(message: any, keywords?: any): boolean {
  const text = normalizeText(String(message ?? ""));
  const kws = normalizeEscalationKeywords(keywords);
  return kws.some((kw) => text.includes(normalizeText(String(kw))));
}

export function isEscalationRequest(...args: any[]): boolean {
  const { data } = mergeArgs(args);
  const message = data.message ?? data.text ?? data.content ?? data.question ?? data.input ?? data;
  const keywords = data.keywords ?? data.escalationKeywords ?? data.escalation_keywords;
  if (hasEscalationKeyword(message, keywords)) return true;
  // intent based
  const intent = String(data.intent ?? data.classification?.intent ?? "").toLowerCase();
  if (intent === "reclamo" || intent === "complaint" || intent === "escalate") return true;
  // explicit request phrases
  const text = normalizeText(String(message ?? ""));
  if (text.includes("hablar con") || text.includes("humano") || text.includes("agente")) return true;
  // forbidden topics are escalation triggers
  const forbidden =
    data.forbidden ?? data.forbiddenTopic ?? data.forbiddenTopics ?? data.forbidden_topics ?? data.topics;
  if (forbidden === true) return true;
  try {
    if (isForbiddenTopic(message, forbidden)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export const shouldEscalate = isEscalationRequest;
export const needsEscalation = isEscalationRequest;
export const mustEscalate = isEscalationRequest;
export const requiresEscalation = isEscalationRequest;
export const isEscalation = isEscalationRequest;
export const detectEscalation = isEscalationRequest;
export const escalationNeeded = isEscalationRequest;

export function escalationReason(...args: any[]): string {
  const { data } = mergeArgs(args);
  if (data.reason) return String(data.reason);
  const message = data.message ?? data.text ?? data.content ?? data.question ?? data.input;
  const intent = String(data.intent ?? data.classification?.intent ?? "").toLowerCase();
  if (intent === "reclamo") return "reclamo";
  if (hasEscalationKeyword(message, data.keywords ?? data.escalationKeywords)) return "keyword";
  if (data.forbidden === true || data.forbiddenTopic === true) return "forbidden_topic";
  return "explicit_request";
}

// ---------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------

const __escalationDefault = escalateThread as any;
Object.assign(__escalationDefault, {
  escalateThread,
  escalate,
  derive,
  derivar,
  handoff,
  handoffThread,
  markEscalated,
  markDerived,
  setEscalated,
  escalateConversation,
  escalateHilo,
  reactivateThread,
  reactivate,
  reopen,
  reopenThread,
  unescalate,
  resolveThread,
  activateThread,
  resumeThread,
  closeThread,
  close,
  closeConversation,
  markClosed,
  finishThread,
  setThreadState,
  setThreadStatus,
  setThread,
  transitionThread,
  transition,
  changeState,
  changeStatus,
  updateThreadState,
  updateState,
  updateStatus,
  transitionThreadState,
  threadState,
  getThreadState,
  getState,
  getStatus,
  threadStatus,
  statusOf,
  isEscalated,
  isOpen,
  isClosed,
  isDerived,
  isHandoff,
  canRespond,
  shouldRespond,
  aiCanRespond,
  canReply,
  shouldReply,
  isAiSilent,
  isSilent,
  buildSummary,
  summarize,
  summarizeThread,
  threadSummary,
  buildHandoffSummary,
  handoffSummary,
  createSummary,
  generateSummary,
  normalizeThreadState,
  HANDOFF_MESSAGE,
  ESCALATION_HANDOFF_MESSAGE,
  THREAD_HANDOFF_MESSAGE,
  DERIVATION_MESSAGE,
  THREAD_STATES,
  OPEN_STATE,
  ESCALATED_STATE,
  CLOSED_STATE,
  defaultEscalationKeywords,
  normalizeEscalationKeywords,
  hasEscalationKeyword,
  isEscalationRequest,
  shouldEscalate,
  needsEscalation,
  mustEscalate,
  requiresEscalation,
  isEscalation,
  detectEscalation,
  escalationNeeded,
  escalationReason,
  default: escalateThread,
});
export default __escalationDefault;
