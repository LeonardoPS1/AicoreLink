import crypto from "crypto";
import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { sendChatwootMessage } from "@/lib/chatwoot/client";

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function isAuthorized(request: Request): boolean {
  const internalApiKey = process.env.FACTORY_INTERNAL_API_KEY;
  if (!internalApiKey) return false;
  const headerKey = request.headers.get("x-internal-key");
  if (headerKey && safeEqual(headerKey, internalApiKey)) return true;
  const auth = request.headers.get("authorization");
  if (auth && safeEqual(auth, `Bearer ${internalApiKey}`)) return true;
  return false;
}

function unauthorized(): Response {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeTenantId(body: any): string | null {
  if (!body || typeof body !== "object") return null;
  return body.tenantId ?? body.tenant_id ?? body.tenantID ?? body.tenant ?? null;
}

function parsePeriod(period: any): string | null {
  if (typeof period !== "string") return null;
  if (!/^\d{4}-\d{2}$/.test(period)) return null;
  return period;
}

function periodToDate(period: string): Date {
  const [y, m] = period.split("-");
  return new Date(Date.UTC(Number(y), Number(m) - 1, 1));
}

async function findUsage(tx: any, tenantId: string, period: string) {
  const date = periodToDate(period);
  const where = { tenantId, channel: "whatsapp_text", period: date };
  if (tx?.tenantUsage?.findUnique) {
    try {
      const r = await tx.tenantUsage.findUnique({ where: { tenantId_channel_period: { tenantId, channel: "whatsapp_text", period: date } } });
      if (r) return r;
    } catch {
      // fall through
    }
    try {
      const r = await tx.tenantUsage.findUnique({ where });
      if (r) return r;
    } catch {
      // fall through
    }
  }
  if (tx?.tenantUsage?.findFirst) {
    try {
      const r = await tx.tenantUsage.findFirst({ where: { tenantId, channel: "whatsapp_text", period: date } });
      if (r) return r;
    } catch {
      // fall through
    }
    try {
      const r = await tx.tenantUsage.findFirst({ where: { tenantId, channel: "whatsapp_text" } });
      // accept if period matches loosely
      if (r && (r.period?.toISOString?.().startsWith(period) || String(r.period).startsWith(period))) return r;
    } catch {
      // fall through
    }
  }
  if (tx?.tenantUsage?.findMany) {
    try {
      const rows = await tx.tenantUsage.findMany({ where: { tenantId, channel: "whatsapp_text" } });
      const match = (rows ?? []).find((r: any) => {
        const p = r?.period;
        const iso = p?.toISOString ? p.toISOString() : String(p ?? "");
        return iso.startsWith(period);
      });
      if (match) return match;
    } catch {
      // fall through
    }
  }
  return null;
}

async function alreadySent(tx: any, tenantId: string, period: string): Promise<boolean> {
  const stores = [tx?.auditLog, (db as any)?.auditLog].filter(Boolean);
  for (const store of stores) {
    if (typeof store.findFirst === "function") {
      try {
        const r = await store.findFirst({
          where: { tenantId, action: "report_sent", meta: { path: ["period"], equals: period } },
        });
        if (r) return true;
      } catch {
        // fall through
      }
      try {
        const r = await store.findFirst({ where: { tenantId, action: "report_sent" } });
        if (r && (r.meta?.period === period || r.meta?.period === period)) return true;
      } catch {
        // fall through
      }
    }
    if (typeof store.findMany === "function") {
      try {
        const rows = await store.findMany({ where: { tenantId, action: "report_sent" } });
        if ((rows ?? []).some((r: any) => r?.meta?.period === period)) return true;
      } catch {
        // fall through
      }
    }
  }
  return false;
}

async function createAudit(tx: any, tenantId: string, period: string) {
  const stores = [tx?.auditLog, (db as any)?.auditLog].filter(Boolean);
  for (const store of stores) {
    if (typeof store.create === "function") {
      try {
        await store.create({ data: { tenantId, action: "report_sent", meta: { period } } });
        return;
      } catch {
        // try next
      }
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorized(request)) return unauthorized();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tenantId = normalizeTenantId(body);
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const period = parsePeriod(body?.period ?? body?.month ?? body?.periodMonth);
  if (!period) {
    return NextResponse.json({ error: "period is required (YYYY-MM)" }, { status: 400 });
  }

  try {
    const result = await withTenant(String(tenantId), async (tx) => {
      const usage = await findUsage(tx, String(tenantId), period);
      if (!usage) {
        return { sent: false, reason: "no_data" };
      }

      if (await alreadySent(tx, String(tenantId), period)) {
        return { sent: false, reason: "already_sent" };
      }

      const messagesIn = Number(usage.messagesIn ?? usage.messages_in ?? 0);
      const messagesOut = Number(usage.messagesOut ?? usage.messages_out ?? 0);
      const tokensUsed = Number(usage.tokensUsed ?? usage.tokens_used ?? 0);
      const costEstimate = Number(usage.costEstimate ?? usage.cost_estimate ?? 0);

      const report = [
        `Reporte mensual ${period}`,
        `Mensajes entrantes: ${messagesIn}`,
        `Mensajes salientes: ${messagesOut}`,
        `Tokens usados: ${tokensUsed}`,
        `Costo estimado: ${costEstimate}`,
      ].join("\n");

      // Chatwoot send if channel configured (best-effort)
      let configured = false;
      let accountId: any;
      let conversationId: any;
      let accessToken: any;
      try {
        const channel = await (tx as any)?.tenantChannel?.findUnique?.({
          where: { tenantId_channel: { tenantId: String(tenantId), channel: "whatsapp_text" } },
        });
        const cfg = (channel?.config ?? {}) as any;
        accountId = cfg?.accountId ?? cfg?.chatwootAccountId ?? cfg?.chatwoot_account_id ?? process.env.CHATWOOT_ACCOUNT_ID;
        conversationId = cfg?.conversationId ?? cfg?.chatwootConversationId ?? cfg?.chatwoot_conversation_id ?? process.env.CHATWOOT_CONVERSATION_ID;
        accessToken = cfg?.accessToken ?? cfg?.apiAccessToken ?? cfg?.chatwootApiToken ?? process.env.CHATWOOT_API_TOKEN ?? process.env.CHATWOOT_API_ACCESS_TOKEN;
        configured = !!(channel ? channel.enabled !== false : true) && !!accountId && !!conversationId && !!accessToken;
      } catch {
        accountId = process.env.CHATWOOT_ACCOUNT_ID;
        conversationId = process.env.CHATWOOT_CONVERSATION_ID;
        accessToken = process.env.CHATWOOT_API_TOKEN ?? process.env.CHATWOOT_API_ACCESS_TOKEN;
        configured = !!accountId && !!conversationId && !!accessToken;
      }

      if (configured) {
        try {
          await sendChatwootMessage({
            accountId,
            conversationId,
            content: report,
            accessToken,
          });
        } catch (err) {
          console.error("[internal/report] sendChatwootMessage failed:", err);
        }
      } else {
        console.log("[internal/report] chatwoot not configured; report:\n" + report);
      }

      await createAudit(tx, String(tenantId), period);

      return { sent: true, period };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[internal/report] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}