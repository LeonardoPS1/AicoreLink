import crypto from "crypto";
import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-context";
import { mirrorMessage } from "@/lib/conversations/mirror";
import { conversationKey } from "@/lib/conversations/identity";
import { loadTenantWhatsAppConfig } from "@/lib/whatsapp/config";
import { listKnowledgeEntries, getForbiddenTopics, knowledgeBaseToString } from "@/lib/knowledge/repository";
import { guardrailReply } from "@/lib/knowledge/guardrails";

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

  const contactRef = body?.contactRef ?? body?.contact_ref ?? body?.contact ?? body?.senderRef ?? "";
  const message = body?.message ?? body?.content ?? body?.text ?? "";
  const messageId = body?.messageId ?? body?.message_id ?? body?.id;

  let key: string;
  if (body?.conversationKey || body?.conversation_key || body?.key) {
    key = String(body.conversationKey ?? body.conversation_key ?? body.key);
  } else if (contactRef) {
    key = conversationKey(String(tenantId), contactRef);
  } else {
    key = conversationKey(String(tenantId), String(messageId ?? `contact_${tenantId}`));
  }

  try {
    const tenantConfig = await loadTenantWhatsAppConfig(String(tenantId));
    const entries = await listKnowledgeEntries(String(tenantId));
    const forbiddenTopics = await getForbiddenTopics(String(tenantId));
    const kbText = knowledgeBaseToString(entries);
    const reply = guardrailReply(String(message), kbText, forbiddenTopics);

    // Persist the outbound (AI) reply best-effort.
    const externalId =
      messageId != null && messageId !== ""
        ? `${String(messageId)}-reply`
        : `reply_${crypto.createHash("sha256").update(String(message)).digest("hex").slice(0, 16)}`;
    try {
      await withTenant(String(tenantId), async (tx) => {
        await mirrorMessage(tx, {
          tenantId: String(tenantId),
          conversationKey: key,
          chatwootMessageId: externalId,
          direction: "out",
          content: String(reply),
          senderRef: "ai",
          aiGenerated: true,
        });
      });
    } catch (err) {
      console.error("[internal/reply] mirror failed:", err);
    }

    return NextResponse.json({ ok: true, success: true, reply });
  } catch (err) {
    console.error("[internal/reply] error:", err);
    return NextResponse.json(
      { ok: false, success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) return unauthorized();
  return NextResponse.json({ ok: true, status: "ok" });
}