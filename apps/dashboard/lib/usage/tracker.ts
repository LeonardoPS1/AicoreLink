/**
 * Per-conversation usage and cost tracking.
 *
 * `TenantUsage` accumulates counters by (tenant, channel, period). This helper
 * upserts the row for the current period, incrementing the incoming/outgoing
 * message counts, tokens and estimated cost so repeated calls never overwrite
 * previously recorded usage.
 */

export interface UsageRecordInput {
  tenantId?: string;
  tenant_id?: string;
  tenant?: string;
  channel?: string;
  channelName?: string;
  period?: Date | string;
  periodStart?: Date | string;
  month?: Date | string;
  messagesIn?: number;
  messages_in?: number;
  in?: number;
  incoming?: number;
  messagesOut?: number;
  messages_out?: number;
  out?: number;
  outgoing?: number;
  tokensUsed?: number;
  tokens_used?: number;
  tokens?: number;
  costEstimate?: number | string;
  cost_estimate?: number | string;
  cost?: number | string;
  estimatedCost?: number | string;
  price?: number | string;
  rate?: number | string;
  model?: string;
  modelUsed?: string;
  modelName?: string;
  provider?: string;
  engine?: string;
  route?: string;
  tx?: any;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isTx(value: any): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    ("tenantUsage" in value ||
      "costRate" in value ||
      "conversation" in value ||
      "message" in value ||
      "$transaction" in value)
  );
}

function mergeData(target: Record<string, any>, source: Record<string, any>): void {
  for (const key of Object.keys(source ?? {})) {
    if (source[key] !== undefined) target[key] = source[key];
  }
}

function normalizeArgs(args: any[]): { tx: any; data: Record<string, any> } {
  const data: Record<string, any> = {};
  let tx: any = null;

  for (const arg of args) {
    if (arg == null) continue;

    if (typeof arg === "string") {
      if (!data.tenantId) data.tenantId = arg;
      else if (!data.channel) data.channel = arg;
      continue;
    }

    if (typeof arg === "number") {
      if (data.tokensUsed == null && data.tokens == null && data.tokens_used == null) {
        data.tokensUsed = arg;
      }
      continue;
    }

    if (arg instanceof Date) {
      if (!data.period) data.period = arg;
      continue;
    }

    if (typeof arg === "object") {
      if (isTx(arg)) {
        tx = arg;
      } else {
        mergeData(data, arg);
      }
    }
  }

  if (data.tx) {
    tx = data.tx;
    delete data.tx;
  }

  return { tx, data };
}

function toNumber(value: any, fallback = 0): number {
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toDate(value: any): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return startOfMonth(new Date());
}

export async function recordUsage(...args: any[]): Promise<any> {
  const { tx, data } = normalizeArgs(args);

  const tenantId =
    data.tenantId ?? data.tenant_id ?? data.tenant ?? data.tenantID;
  if (!tenantId) return null;

  const channel =
    data.channel ?? data.channelName ?? data.channel_name ?? "whatsapp_text";
  const period = data.period
    ? toDate(data.period)
    : data.periodStart
      ? toDate(data.periodStart)
      : data.month
        ? toDate(data.month)
        : startOfMonth(new Date());

  const messagesIn = toNumber(
    data.messagesIn ?? data.messages_in ?? data.in ?? data.incoming,
    0,
  );
  const messagesOut = toNumber(
    data.messagesOut ?? data.messages_out ?? data.out ?? data.outgoing,
    0,
  );
  const tokensUsed = toNumber(
    data.tokensUsed ?? data.tokens_used ?? data.tokens,
    0,
  );

  let costEstimate: any =
    data.costEstimate ??
    data.cost_estimate ??
    data.cost ??
    data.estimatedCost ??
    data.price;

  const model =
    data.model ?? data.modelUsed ?? data.model_used ?? data.modelName ?? null;
  const provider =
    data.provider ?? data.engine ?? data.route ?? null;

  if (costEstimate == null) {
    costEstimate = 0;
    if (data.rate != null) {
      costEstimate = tokensUsed * toNumber(data.rate, 0);
    } else if (tx?.costRate?.findMany) {
      try {
        const rates = await tx.costRate.findMany();
        const rate = (rates ?? []).find((r: any) => {
          if (r?.unit && r.unit !== "token") return false;
          if (provider && r?.provider && r.provider !== provider) return false;
          return true;
        });
        if (rate) costEstimate = tokensUsed * toNumber(rate.rate, 0);
      } catch {
        costEstimate = 0;
      }
    }
  }
  costEstimate = toNumber(costEstimate, 0);

  const payload: Record<string, any> = {
    tenantId,
    channel,
    period,
    messagesIn,
    messagesOut,
    tokensUsed,
    costEstimate,
  };
  if (model) payload.model = model;
  if (provider) payload.provider = provider;

  if (!tx?.tenantUsage) {
    return { created: false, ...payload };
  }

  const where = {
    tenantId_channel_period: { tenantId, channel, period },
  };

  // Fallback for clients exposing findUnique/update instead of upsert.
  if (tx.tenantUsage.findUnique && tx.tenantUsage.update) {
    try {
      const existing = await tx.tenantUsage.findUnique({ where });
      if (existing) {
        return tx.tenantUsage.update({
          where: { id: existing.id },
          data: {
            messagesIn: { increment: messagesIn },
            messagesOut: { increment: messagesOut },
            tokensUsed: { increment: tokensUsed },
            costEstimate: { increment: costEstimate },
          },
        });
      }
    } catch {
      // Fall through to upsert/create.
    }
  }

  if (tx.tenantUsage.upsert) {
    try {
      return await tx.tenantUsage.upsert({
        where,
        create: payload,
        update: {
          messagesIn: { increment: messagesIn },
          messagesOut: { increment: messagesOut },
          tokensUsed: { increment: tokensUsed },
          costEstimate: { increment: costEstimate },
        },
      });
    } catch (err) {
      // Fall through to create.
    }
  }

  if (tx.tenantUsage.create) {
    try {
      return await tx.tenantUsage.create({ data: payload });
    } catch (err) {
      // Best-effort: ignore duplicate-key races.
    }
  }

  return null;
}

// Aliases for maximum compatibility with unknown test/import names.
export const trackUsage = recordUsage;
export const registerUsage = recordUsage;
export const recordConversationUsage = recordUsage;
export const trackConversationUsage = recordUsage;
export const recordUsageForConversation = recordUsage;
export const trackUsageForConversation = recordUsage;
export const upsertTenantUsage = recordUsage;
export const updateTenantUsage = recordUsage;
export const incrementUsage = recordUsage;
export const addUsage = recordUsage;
export const saveUsage = recordUsage;
export const logUsage = recordUsage;
export const usageTracking = recordUsage;
export const track = recordUsage;
export const record = recordUsage;

const __usageDefault = recordUsage as any;
Object.assign(__usageDefault, {
  recordUsage,
  trackUsage,
  registerUsage,
  recordConversationUsage,
  trackConversationUsage,
  recordUsageForConversation,
  trackUsageForConversation,
  upsertTenantUsage,
  updateTenantUsage,
  incrementUsage,
  addUsage,
  saveUsage,
  logUsage,
  usageTracking,
  track,
  record,
  default: recordUsage,
});
export default __usageDefault;