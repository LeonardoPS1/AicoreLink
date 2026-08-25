import { NextRequest, NextResponse } from "next/server";
import { resolveTenantByPhoneNumberId } from "@/lib/whatsapp/resolve-tenant";
import { hasFeature } from "@/lib/entitlements";
import { verifyMetaSignature } from "@/lib/whatsapp/meta-client";

const META_VERIFY_TOKEN = process.env.AICORELINK_META_VERIFY_TOKEN ?? "";
const N8N_WEBHOOK_URL = process.env.AICORELINK_N8N_WHATSAPP_WEBHOOK_URL ?? "";
const META_APP_SECRET = process.env.AICORELINK_META_APP_SECRET ?? "";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";

  if (META_APP_SECRET && !verifyMetaSignature(body, signature, META_APP_SECRET)) {
    console.warn("[webhook] Invalid Meta signature");
    return new NextResponse("Invalid signature", { status: 401 });
  }

  interface MetaWebhookPayload {
    entry: Array<{
      changes: Array<{
        value: {
          messaging_product: string;
          metadata: { phone_number_id: string };
          messages?: Array<{
            from: string;
            id: string;
            timestamp: string;
            type: string;
            text?: { body: string };
          }>;
        };
      }>;
    }>;
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const messages = value?.messages;
  const phoneNumberId = value?.metadata?.phone_number_id;

  if (!phoneNumberId || !messages?.length) {
    return new NextResponse("OK", { status: 200 });
  }

  const message = messages[0] as Record<string, unknown>;
  const from = message.from as string;
  const msgId = message.id as string;
  const timestamp = message.timestamp as string;
  const textBody = (message.text as Record<string, unknown> | undefined)?.body as string | undefined;
  const msgType = message.type as string;

  if (msgType !== "text" || !textBody) {
    return new NextResponse("OK", { status: 200 });
  }

  const tenantId = await resolveTenantByPhoneNumberId(phoneNumberId);
  if (!tenantId) {
    console.warn(`[webhook] No tenant found for phone_number_id: ${phoneNumberId}`);
    return new NextResponse("OK", { status: 200 });
  }

  const featureActive = await hasFeature(tenantId, "whatsapp_text");
  if (!featureActive) {
    return new NextResponse("OK", { status: 200 });
  }

  if (N8N_WEBHOOK_URL) {
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          phoneNumberId,
          contactRef: from,
          message: textBody,
          messageId: msgId,
          timestamp: parseInt(timestamp, 10) * 1000,
        }),
      });
    } catch (error) {
      console.error("[webhook] Failed to trigger n8n:", error);
    }
  }

  return new NextResponse("OK", { status: 200 });
}