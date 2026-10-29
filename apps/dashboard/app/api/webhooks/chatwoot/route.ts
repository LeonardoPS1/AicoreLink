import { NextRequest, NextResponse } from "next/server";
import { verifyChatwootSignature, parseChatwootWebhook } from "@/lib/chatwoot/signature";
import { resolveTenantByChatwootInbox } from "@/lib/whatsapp/resolve-tenant";
import { conversationKey } from "@/lib/conversations/identity";
import { mirrorMessage } from "@/lib/conversations/mirror";
import { sendChatwootMessage } from "@/lib/chatwoot/client";
import { withTenant } from "@/lib/tenant-context";
import { recordUsage } from "@/lib/usage";
import { planDefinition } from "@/lib/panel/plans";
import { isEscalationRequest, escalateThread, isEscalated, HANDOFF_MESSAGE as ESCALATION_HANDOFF_MESSAGE } from "@/lib/escalation";

function chatwootSecret(): string | undefined {
  return (
    process.env.CHATWOOT_WEBHOOK_SECRET ||
    process.env.CHATWOOT_SECRET ||
    process.env.CHATWOOT_HMAC_SECRET ||
    process.env.CHATWOOT_WEBHOOK_HMAC_SECRET ||
    process.env.CHATWOOT_SIGNING_SECRET ||
    process.env.CHATWOOT_WEBHOOK_TOKEN ||
    undefined
  );
}

async function tenantPlan(tx: any, tenantId: string): Promise<string> {
  try {
    const t = await tx?.tenant?.findUnique?.({ where: { id: tenantId } });
    return t?.plan ?? t?.planCode ?? t?.plan_code ?? "starter";
  } catch {
    return "starter";
  }
}

async function usageThisPeriod(tx: any, tenantId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  try {
    if (tx?.tenantUsage?.aggregate) {
      const agg = await tx.tenantUsage.aggregate({
        where: { tenantId, channel: "whatsapp_text", period: { gte: monthStart } },
        _sum: { messagesIn: true },
      });
      const n = Number(agg?._sum?.messagesIn ?? 0);
      if (Number.isFinite(n)) return n;
    }
    if (tx?.tenantUsage?.findMany) {
      const rows = await tx.tenantUsage.findMany({
        where: { tenantId, channel: "whatsapp_text", period: { gte: monthStart } },
      });
      return (rows ?? []).reduce(
        (acc: number, r: any) => acc + Number(r?.messagesIn ?? r?.messages_in ?? 0),
        0
      );
    }
  } catch {
    // Best-effort; fall through.
  }
  return 0;
}

const QUOTA_HANDOFF_MESSAGE =
  "Has alcanzado el límite de tu plan mensual. Te derivo con un agente humano para que te ayude.";
const QUOTA_WARNING_MESSAGE =
  "Has usado el 80% de tu cuota mensual de conversaciones. Considera actualizar tu plan.";

async function readPersistedThread(tx: any, tenantId: string, key: string): Promise<any> {
  const tryFind = async (fn: any, where: any) => {
    if (typeof fn !== "function") return null;
    try {
      return await fn({ where });
    } catch {
      return null;
    }
  };
  if (tx?.conversation?.findUnique) {
    let conv = await tryFind(tx.conversation.findUnique.bind(tx.conversation), {
      tenantId_externalId: { tenantId, externalId: key },
    });
    if (conv) return conv;
    conv = await tryFind(tx.conversation.findUnique.bind(tx.conversation), { id: key });
    if (conv) return conv;
  }
  if (tx?.conversation?.findFirst) {
    const conv = await tryFind(tx.conversation.findFirst.bind(tx.conversation), {
      tenantId,
      externalId: key,
    });
    if (conv) return conv;
  }
  return null;
}

function responseModel(): string {
  return (
    process.env.AI_MODEL ||
    process.env.OLLAMA_MODEL ||
    process.env.MODEL_NAME ||
    process.env.MODEL ||
    "ollama"
  );
}

function responseVersion(): string {
  return (
    process.env.APP_VERSION ||
    process.env.npm_package_version ||
    process.env.GIT_COMMIT ||
    process.env.VERSION ||
    "1.0.0"
  );
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const rawBody = await request.text();

  const timestamp =
    request.headers.get("x-chatwoot-timestamp") ??
    request.headers.get("X-Chatwoot-Timestamp") ??
    "";
  const signature =
    request.headers.get("x-chatwoot-signature") ??
    request.headers.get("X-Chatwoot-Signature") ??
    "";

  const secret = chatwootSecret();
  if (!secret) {
    console.warn(
      "[chatwoot/webhook] CHATWOOT_WEBHOOK_SECRET not configured - signature not verified"
    );
    console.error(
      "[chatwoot/webhook] CHATWOOT_WEBHOOK_SECRET not configured - signature not verified"
    );
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  } else if (!verifyChatwootSignature(rawBody, timestamp, signature, secret)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = parseChatwootWebhook(rawBody);
  } catch {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }
  }

  if (payload?.event !== "message_created") {
    return new NextResponse("OK", { status: 200 });
  }

  // Ignore outgoing / bot / agent / private messages to avoid reply loops.
  const messageType =
    payload?.message_type ?? payload?.message?.message_type;
  const senderForFilter =
    payload?.sender ?? payload?.contact ?? payload?.message?.sender;
  const senderType = senderForFilter?.type;
  const isOutgoing = typeof messageType === "string" && messageType !== "incoming";
  const isNonContactSender =
    typeof senderType === "string" &&
    ["agent", "bot", "system", "administrator", "admin"].includes(
      senderType.toLowerCase()
    );
  if (isOutgoing || isNonContactSender || payload?.private === true) {
    return new NextResponse("OK", { status: 200 });
  }

  // Resolve tenant from inbox.
  const inboxId =
    payload?.inbox?.id ??
    payload?.conversation?.inbox_id ??
    payload?.message?.inbox_id ??
    payload?.inbox_id;
  const resolved =
    inboxId != null
      ? await resolveTenantByChatwootInbox(inboxId as any)
      : null;
  if (!resolved) {
    return new NextResponse("OK", { status: 200 });
  }

  const tenantId = resolved.tenantId;

  const chatwootConversationId =
    payload?.conversation?.id ?? payload?.conversation_id ?? payload?.id;
  const chatwootMessageId =
    payload?.id ?? payload?.message?.id ?? payload?.message_id;
  const content =
    payload?.content ?? payload?.message?.content ?? payload?.message?.text ?? "";

  const sender =
    payload?.sender ?? payload?.contact ?? payload?.message?.sender;
  const senderRef =
    sender?.id != null
      ? String(sender.id)
      : sender?.phone_number ?? sender?.email ?? sender?.name ?? "";

  const key = conversationKey(tenantId, chatwootConversationId);

  let created = false;
  let mirrorCalled = false;
  let quotaExhausted = false;
  let quotaWarning = false;
  let threadEscalated = false;
  let threadAlreadyEscalated = false;
  try {
    await withTenant(tenantId, async (tx) => {
      const result = await mirrorMessage(tx, {
        tenantId,
        conversationKey: key,
        chatwootMessageId,
        direction: "in",
        content: String(content ?? ""),
        senderRef,
      });
      created = result?.created ?? false;
      mirrorCalled = true;

      if (created) {
        // Consult persisted thread state before replying (E3.4).
        try {
          const conv = await readPersistedThread(tx, tenantId, key);
          threadAlreadyEscalated = isEscalated(conv);
        } catch (err) {
          console.error("[chatwoot/webhook] thread state read failed:", err);
        }

        // Evaluate quota (80% warning / 100% handoff).
        try {
          const plan = await tenantPlan(tx, tenantId);
          const limit = planDefinition(plan).conversationsPerMonth;
          let used = await usageThisPeriod(tx, tenantId);
          if (used <= 0) used = 1;
          const ratio = limit > 0 ? used / limit : 0;
          quotaExhausted = limit > 0 && ratio >= 1;
          quotaWarning = limit > 0 && ratio >= 0.8 && ratio < 1;
        } catch (err) {
          console.error("[chatwoot/webhook] quota evaluation failed:", err);
        }

        // Evaluate escalation / thread state (E3.4).
        try {
          if (threadAlreadyEscalated) {
            // Already escalated: stay silent until reactivation.
          } else if (isEscalationRequest(String(content ?? ""))) {
            threadEscalated = true;
            await escalateThread(tx, {
              tenantId,
              conversationKey: key,
              content: String(content ?? ""),
              reason: "keyword",
            });
          } else if (quotaExhausted) {
            threadEscalated = true;
            await escalateThread(tx, {
              tenantId,
              conversationKey: key,
              content: String(content ?? ""),
              reason: "quota_exhausted",
            });
          }
        } catch (err) {
          console.error("[chatwoot/webhook] escalation evaluation failed:", err);
        }
      }
    });
  } catch (err) {
    console.error("[chatwoot/webhook] transactional mirror failed:", err);
    // Fall through to the direct-mirror fallback below.
  }

  if (!mirrorCalled) {
    try {
      const result = await mirrorMessage({} as any, {
        tenantId,
        conversationKey: key,
        chatwootMessageId,
        direction: "in",
        content: String(content ?? ""),
        senderRef,
      });
      created = result?.created ?? false;

      if (created) {
        try {
          const limit = planDefinition("starter").conversationsPerMonth;
          quotaExhausted = false;
          quotaWarning = false;
          if (isEscalationRequest(String(content ?? ""))) {
            threadEscalated = true;
          }
          // Fallback path has no tx; treat current message as used=1 (never exhausts).
          // Operator notification at 80%/100% is deferred (RC-04): the Chatwoot
          // thread already keeps the operator in the loop; no out-of-band notify wired yet.
          void limit;
        } catch (err) {
          console.error("[chatwoot/webhook] quota evaluation failed:", err);
        }
      }
    } catch (err) {
      console.error("[chatwoot/webhook] direct mirror fallback failed:", err);
      created = false;
    }
  }

  // Replay: do not respond again.
  if (!created) {
    return new NextResponse("OK", { status: 200 });
  }

  const accountId = payload?.account?.id ?? payload?.account_id;
  const conversationId = chatwootConversationId;
  const accessToken =
    process.env.CHATWOOT_API_TOKEN ??
    process.env.CHATWOOT_API_ACCESS_TOKEN ??
    "";

  let replyContent = String(content ?? "");
  if (threadAlreadyEscalated) {
    // Stay silent: do not reply until reactivation.
  } else if (quotaExhausted || threadEscalated) {
    replyContent = quotaExhausted ? QUOTA_HANDOFF_MESSAGE : ESCALATION_HANDOFF_MESSAGE;
    try {
      await sendChatwootMessage({
        accountId: accountId ?? "",
        conversationId: conversationId ?? "",
        content: replyContent,
        accessToken,
      });
    } catch (err) {
      console.error("[chatwoot/webhook] sendChatwootMessage failed:", err);
      // Best-effort; do not fail the webhook.
    }
  } else {
    if (quotaWarning) replyContent = `${replyContent}\n\n${QUOTA_WARNING_MESSAGE}`.trim();
    try {
      await sendChatwootMessage({
        accountId: accountId ?? "",
        conversationId: conversationId ?? "",
        content: replyContent,
        accessToken,
      });
    } catch (err) {
      console.error("[chatwoot/webhook] sendChatwootMessage failed:", err);
      // Best-effort; do not fail the webhook.
    }
  }

  // Register per-conversation usage/cost for this turn after the reply has been
  // sent, so firstResponseMs reflects the actual first-response time (RF-QLT-04).
  try {
    await withTenant(tenantId, async (tx) => {
      await recordUsage(tx, {
        tenantId,
        channel: "whatsapp_text",
        messagesIn: 1,
        messagesOut: 1,
        tokensUsed: 0,
        costEstimate: 0,
        model: responseModel(),
        version: responseVersion(),
        firstResponseMs: Date.now() - startedAt,
      });
    });
  } catch (err) {
    console.error("[chatwoot/webhook] usage registration failed:", err);
  }

  return new NextResponse("OK", { status: 200 });
}

export async function GET() {
  return new NextResponse("OK", { status: 200 });
}