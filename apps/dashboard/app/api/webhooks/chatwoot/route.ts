import { NextRequest, NextResponse } from "next/server";
import { verifyChatwootSignature, parseChatwootWebhook } from "@/lib/chatwoot/signature";
import { resolveTenantByChatwootInbox } from "@/lib/whatsapp/resolve-tenant";
import { conversationKey } from "@/lib/conversations/identity";
import { mirrorMessage } from "@/lib/conversations/mirror";
import { sendChatwootMessage } from "@/lib/chatwoot/client";
import { withTenant } from "@/lib/tenant-context";

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

export async function POST(request: NextRequest) {
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

  try {
    await sendChatwootMessage({
      accountId: accountId ?? "",
      conversationId: conversationId ?? "",
      content: String(content ?? ""),
      accessToken,
    });
  } catch (err) {
    console.error("[chatwoot/webhook] sendChatwootMessage failed:", err);
    // Best-effort; do not fail the webhook.
  }

  return new NextResponse("OK", { status: 200 });
}

export async function GET() {
  return new NextResponse("OK", { status: 200 });
}