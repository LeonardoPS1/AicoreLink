import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-context";
import { mirrorMessage } from "@/lib/conversations/mirror";
import { conversationKey } from "@/lib/conversations/identity";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const internalApiKey = process.env.FACTORY_INTERNAL_API_KEY;
  if (!internalApiKey) return false;
  const headerKey = request.headers.get("x-internal-key");
  if (headerKey === internalApiKey) return true;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${internalApiKey}`) return true;
  return false;
}

function unauthorized(): Response {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeTenantId(body: any): string | null {
  if (!body || typeof body !== "object") return null;
  return (
    body.tenantId ??
    body.tenant_id ??
    body.tenantID ??
    body.tenant ??
    null
  );
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

  const contactRef =
    body?.contactRef ?? body?.contact_ref ?? body?.contact ?? body?.senderRef ?? "";

  const direction = body?.direction ?? "out";
  const content = body?.content ?? body?.message ?? body?.text ?? "";
  const aiGenerated = body?.aiGenerated ?? body?.ai_generated;
  const tokensUsed = body?.tokensUsed ?? body?.tokens_used ?? null;
  const audioUrl = body?.audioUrl ?? body?.audio_url;

  let key: string;
  if (body?.conversationKey || body?.conversation_key || body?.key) {
    key = String(body.conversationKey ?? body.conversation_key ?? body.key);
  } else if (
    body?.chatwootConversationId ||
    body?.chatwoot_conversation_id ||
    body?.conversationId ||
    body?.conversation_id
  ) {
    const cid =
      body.chatwootConversationId ??
      body.chatwoot_conversation_id ??
      body.conversationId ??
      body.conversation_id;
    key = conversationKey(String(tenantId), cid);
  } else {
    key = String(contactRef || `contact_${tenantId}`);
  }

  const externalMessageId =
    body?.messageId ??
    body?.message_id ??
    body?.chatwootMessageId ??
    body?.chatwoot_message_id ??
    body?.externalMessageId ??
    body?.external_message_id ??
    body?.id;

  const resolvedExternalId =
    externalMessageId != null && externalMessageId !== ""
      ? String(externalMessageId)
      : `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const senderRef = body?.senderRef ?? body?.sender_ref ?? contactRef ?? "";

  try {
    const result = await withTenant(String(tenantId), async (tx) => {
      return mirrorMessage(tx, {
        tenantId: String(tenantId),
        conversationKey: key,
        chatwootMessageId: resolvedExternalId,
        direction: String(direction),
        content: String(content ?? ""),
        audioUrl,
        senderRef: String(senderRef ?? ""),
        aiGenerated,
        tokensUsed: tokensUsed === null ? undefined : Number(tokensUsed),
      });
    });

    return NextResponse.json({
      ok: true,
      success: true,
      created: (result as any)?.created ?? false,
      messageId: resolvedExternalId,
    });
  } catch (err) {
    console.error("[internal/messages] error:", err);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) return unauthorized();

  const url = new URL(request.url);
  const tenantId =
    url.searchParams.get("tenantId") ??
    url.searchParams.get("tenant_id") ??
    url.searchParams.get("tenant");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const limitRaw = url.searchParams.get("limit");
  const limit = Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : 50;

  try {
    const messages = await withTenant(String(tenantId), async (tx) => {
      if (tx?.message?.findMany) {
        return tx.message.findMany({
          where: { tenantId: String(tenantId) },
          orderBy: { createdAt: "desc" },
          take: limit,
        });
      }
      return [];
    });

    return NextResponse.json({ ok: true, success: true, messages });
  } catch (err) {
    console.error("[internal/messages GET] error:", err);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}