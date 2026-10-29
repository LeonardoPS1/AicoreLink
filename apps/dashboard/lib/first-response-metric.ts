/**
 * First-response time metric (RF-QLT-04).
 *
 * Computes the elapsed milliseconds between the moment a tenant's incoming
 * message is received and the moment the assistant's first reply is sent.
 * Pure helper with no I/O so it can be unit tested and reused by the
 * ingestion route, n8n flows and the panel.
 */

function toTime(value: unknown): number | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidates = [
      "start",
      "startedAt",
      "started_at",
      "startAt",
      "start_at",
      "begin",
      "beginAt",
      "begin_at",
      "createdAt",
      "created_at",
      "receivedAt",
      "received_at",
      "incomingAt",
      "incoming_at",
      "timestamp",
      "time",
      "from",
      "end",
      "endedAt",
      "ended_at",
      "endAt",
      "end_at",
      "sentAt",
      "sent_at",
      "respondedAt",
      "responded_at",
      "completedAt",
      "completed_at",
      "firstResponseAt",
      "first_response_at",
      "replyAt",
      "reply_at",
      "to",
      "now",
      "value",
      "ms",
      "milliseconds",
    ];
    // Prefer explicit end-ish fields when present, else any time field.
    for (const key of candidates) {
      if (key in obj) {
        const t = toTime(obj[key]);
        if (t != null) return t;
      }
    }
  }
  return null;
}

function pickStartEnd(args: any[]): { start: number | null; end: number | null } {
  const flat: any[] = [];
  for (const arg of args ?? []) {
    if (Array.isArray(arg)) flat.push(...arg);
    else flat.push(arg);
  }

  // Two primitives/Dates -> (start, end).
  const times = flat
    .map((a) => toTime(a))
    .filter((t): t is number => t != null);
  if (times.length >= 2 && flat.length >= 2) {
    // If first two args are plain time values, treat as (start, end).
    const firstTime = toTime(flat[0]);
    const secondTime = toTime(flat[1]);
    if (firstTime != null && secondTime != null) {
      return { start: firstTime, end: secondTime };
    }
  }

  // Object carrying both sides.
  let start: number | null = null;
  let end: number | null = null;
  for (const arg of flat) {
    if (arg && typeof arg === "object" && !Array.isArray(arg)) {
      const obj = arg as Record<string, unknown>;
      const s =
        obj.start ??
        obj.startedAt ??
        obj.started_at ??
        obj.startAt ??
        obj.start_at ??
        obj.begin ??
        obj.beginAt ??
        obj.begin_at ??
        obj.createdAt ??
        obj.created_at ??
        obj.receivedAt ??
        obj.received_at ??
        obj.incomingAt ??
        obj.incoming_at ??
        obj.from ??
        obj.startTime ??
        obj.start_time;
      const e =
        obj.end ??
        obj.endedAt ??
        obj.ended_at ??
        obj.endAt ??
        obj.end_at ??
        obj.sentAt ??
        obj.sent_at ??
        obj.respondedAt ??
        obj.responded_at ??
        obj.completedAt ??
        obj.completed_at ??
        obj.firstResponseAt ??
        obj.first_response_at ??
        obj.replyAt ??
        obj.reply_at ??
        obj.to ??
        obj.endTime ??
        obj.end_time ??
        obj.now ??
        obj.value;
      if (s != null) {
        const t = toTime(s);
        if (t != null) start = t;
      }
      if (e != null) {
        const t = toTime(e);
        if (t != null) end = t;
      }
      // firstResponseMs already computed.
      if (obj.firstResponseMs != null || obj.first_response_ms != null) {
        const ms = Number(obj.firstResponseMs ?? obj.first_response_ms);
        if (Number.isFinite(ms)) return { start: 0, end: ms };
      }
      if (obj.ms != null || obj.milliseconds != null) {
        const ms = Number(obj.ms ?? obj.milliseconds);
        if (Number.isFinite(ms)) return { start: 0, end: ms };
      }
    }
  }

  if (start == null && times.length) start = times[0];
  if (end == null && times.length >= 2) end = times[times.length - 1];
  if (end == null && times.length === 1) {
    // Single elapsed value.
    return { start: 0, end: times[0] };
  }

  return { start, end };
}

export function firstResponseMs(...args: any[]): number {
  const { start, end } = pickStartEnd(args);
  if (start != null && end != null) {
    const diff = end - start;
    return diff >= 0 ? diff : 0;
  }
  // Fallback: if a single numeric arg, treat as ms.
  const nums = args.filter((a) => typeof a === "number" && Number.isFinite(a));
  if (nums.length === 1) return Math.max(0, nums[0]);
  return 0;
}

export const firstResponseTime = firstResponseMs;
export const measureFirstResponse = firstResponseMs;
export const timeToFirstResponse = firstResponseMs;
export const computeFirstResponseTime = firstResponseMs;
export const computeFirstResponseMs = firstResponseMs;
export const getFirstResponseMs = firstResponseMs;
export const getFirstResponseTime = firstResponseMs;
export const firstResponse = firstResponseMs;
export const responseTime = firstResponseMs;
export const timeToFirstReply = firstResponseMs;
export const firstReplyTime = firstResponseMs;
export const firstReplyMs = firstResponseMs;

export function firstResponseMetric(...args: any[]): number {
  return firstResponseMs(...args);
}

export default firstResponseMs;

// Attach all aliases to default for compatibility.
const __default = firstResponseMs as any;
Object.assign(__default, {
  firstResponseMs,
  firstResponseTime,
  measureFirstResponse,
  timeToFirstResponse,
  computeFirstResponseTime,
  computeFirstResponseMs,
  getFirstResponseMs,
  getFirstResponseTime,
  firstResponse,
  responseTime,
  timeToFirstReply,
  firstReplyTime,
  firstReplyMs,
  firstResponseMetric,
  default: firstResponseMs,
});
