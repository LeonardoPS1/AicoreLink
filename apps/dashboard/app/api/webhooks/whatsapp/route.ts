import { NextRequest, NextResponse } from "next/server";
import { resolveTenantByPhoneNumberId } from "@/lib/whatsapp/resolve-tenant";
import { hasFeature } from "@/lib/entitlements";
import { verifyMetaSignature, getMediaUrl, downloadMedia } from "@/lib/whatsapp/meta-client";
import { transcribeAudioFromUrl } from "@/lib/voice/stt";
import { db } from "@/lib/db";
import { ollamaClassifyIntent } from "@/lib/ai/ollama-client";
import { openRouterClassifyIntent } from "@/lib/ai/openrouter-client";

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN ?? "";
const N8N_WEBHOOK_URL = process.env.N8N_WHATSAPP_WEBHOOK_URL ?? "";
const META_APP_SECRET = process.env.META_APP_SECRET ?? "";
const META_CLOUD_API_TOKEN = process.env.META_CLOUD_API_TOKEN ?? "";

const escalationKeywords: string[] = ["humano", "persona", "agente", "reclamo", "queja"];

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
          audio?: { id: string; mime_type: string; sha256: string };
        }>;
      };
    }>;
  }>;
}

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

async function persistMessage(
  tenantId: string,
  conversationId: string | null,
  direction: "in" | "out",
  content: string,
  mediaType: "text" | "audio",
  metadata?: { messageId?: string; aiGenerated?: boolean; tokensUsed?: number; audioId?: string; transcript?: string }
) {
  await db.conversation.upsert({
    where: { id: conversationId ?? "" },
    update: {},
    create: {
      id: conversationId ?? "",
      tenantId,
      channel: "whatsapp_text",
      contactRef: `whatsapp:${String(metadata?.messageId)}`,
      status: "abierta",
      escalado: false,
    },
  });

  await db.message.create({
    data: {
      id: metadata?.messageId ?? "",
      conversationId: conversationId ?? "",
      tenantId,
      direction,
      content,
      aiGenerated: metadata?.aiGenerated ?? false,
      tokensUsed: metadata?.tokensUsed,
      mediaType,
      ...(metadata?.audioId && { audioId: metadata.audioId }),
      ...(metadata?.transcript && { transcript: metadata.transcript }),
    },
  });
}

import { processWhatsAppMessage, INITIAL_WHATSAPP_STATE } from "@/lib/whatsapp/conversation-handler";
import type { WhatsAppConversationStep, WhatsAppConversationState } from "@/lib/whatsapp/conversation-steps";

const conversationStates: Record<string, WhatsAppConversationState> = {};

async function processTextMessage(
  tenantId: string,
  phoneNumberId: string,
  from: string,
  msgId: string,
  timestamp: string,
  textBody: string
) {
  const featureActive = await hasFeature(tenantId, "whatsapp_text");
  if (!featureActive) {
    return;
  }

  // Step 1: Obtener o inicializar estado de conversación
  let state = conversationStates[from];
  if (!state) {
    state = {
      ...INITIAL_WHATSAPP_STATE,
      conversationId: from,
    };
    conversationStates[from] = state;
  }

  // Step 2: Procesar mensaje con handler de conversación paso a paso
  const result = await processWhatsAppMessage(textBody, state.step, [], state.businessInfo);

  // Step 3: Actualizar estado de conversación
  state.step = result.nextStep;
  state.turnCount = (state.turnCount ?? 0) + 1;
  state.waitingForUser = !result.completed && !result.shouldEscalate;
  
  // Guardar info de negocio si viene en el primer mensaje (greeting)
  if (state.step === "diagnosis" && !state.businessInfo) {
    // Extraer nombre del negocio del mensaje inicial - simplificado
    const nameMatch = textBody.match(/([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)/);
    if (nameMatch) {
      state.businessInfo = {
        name: nameMatch[1].trim(),
        category: "por definir", // Se completará después
        description: "",
      };
    }
  }

  // Persistir conversación y mensaje
  const conversationId = await db.conversation.upsert({
    where: { id: `whatsapp_${tenantId}_${from}` },
    update: {},
    create: {
      id: `whatsapp_${tenantId}_${from}`,
      tenantId,
      channel: "whatsapp_text",
      contactRef: from,
      status: "abierta",
      escalado: result.shouldEscalate,
    },
  });

  await db.message.create({
    data: {
      id: msgId,
      conversationId: conversationId.id,
      tenantId,
      direction: "in",
      content: textBody,
      aiGenerated: false,
      mediaType: "text",
    },
  });

  // Step 4: Enviar respuesta apropiada basada en el paso de conversación
  let responseToUser = result.response;
  let shouldSendToN8n = false;

  // Si la conversación finalizó o requiere escalado, enviar a n8n
  if (result.completed || result.shouldEscalate || state.step === "finished") {
    shouldSendToN8n = true;
  }

  // Si la conversación avanzó de paso, también enviar a n8n para tracking
  const stepTransitions: Record<WhatsAppConversationStep, WhatsAppConversationStep> = {
    greeting: "diagnosis",
    diagnosis: "results",
    results: "finished",
    finished: "finished",
  };
  
  if (stepTransitions[state.step] && state.step !== "finished") {
    shouldSendToN8n = true;
  }

  // Enviar a n8n si es necesario
  if (shouldSendToN8n && N8N_WEBHOOK_URL) {
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
          mediaType: "text",
          conversationStep: state.step,
          conversationCompleted: result.completed,
          shouldEscalate: result.shouldEscalate,
          response: result.response,
          turnCount: state.turnCount,
        }),
      });
    } catch (error) {
      console.error("[webhook] Failed to trigger n8n:", error);
    }
  }

  // Retornar respuesta (en producción esto se enviaría directamente por Twilio webhook reply)
  // Por ahora solo loggeamos lo que responderíamos
  console.log(`[webhook] Response for ${from} at step ${state.step}:`, result.response.substring(0, 100));
}

async function processAudioMessage(
  tenantId: string,
  phoneNumberId: string,
  from: string,
  msgId: string,
  timestamp: string,
  audioId: string,
  audioMimeType: string
) {
  const featureActive = await hasFeature(tenantId, "whatsapp_voice");
  if (!featureActive) {
    return;
  }

  if (!META_CLOUD_API_TOKEN) {
    console.error("[webhook] META_CLOUD_API_TOKEN not configured");
    return;
  }

  try {
    const mediaInfo = await getMediaUrl(audioId, META_CLOUD_API_TOKEN);
    const transcriptResult = await transcribeAudioFromUrl(mediaInfo.url, META_CLOUD_API_TOKEN, {
      language: "es",
    });

    const transcript = transcriptResult.text;

    if (N8N_WEBHOOK_URL) {
      await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          phoneNumberId,
          contactRef: from,
          message: transcript,
          messageId: msgId,
          timestamp: parseInt(timestamp, 10) * 1000,
          mediaType: "audio",
          audioId,
          audioMimeType,
          transcript,
        }),
      });
    }
  } catch (error) {
    console.error("[webhook] Failed to process audio:", error);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";

  if (META_APP_SECRET && !verifyMetaSignature(body, signature, META_APP_SECRET)) {
    console.warn("[webhook] Invalid Meta signature");
    return new NextResponse("Invalid signature", { status: 401 });
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

  const message = messages[0];
  const from = message.from;
  const msgId = message.id;
  const timestamp = message.timestamp;
  const msgType = message.type;

  const tenantId = await resolveTenantByPhoneNumberId(phoneNumberId);
  if (!tenantId) {
    console.warn(`[webhook] No tenant found for phone_number_id: ${phoneNumberId}`);
    return new NextResponse("OK", { status: 200 });
  }

  if (msgType === "text") {
    const textBody = message.text?.body;
    if (textBody) {
      await processTextMessage(tenantId, phoneNumberId, from, msgId, timestamp, textBody);
    }
  } else if (msgType === "audio") {
    const audioId = message.audio?.id;
    const audioMimeType = message.audio?.mime_type;
    if (audioId) {
      await processAudioMessage(tenantId, phoneNumberId, from, msgId, timestamp, audioId, audioMimeType ?? "audio/ogg");
    }
  }

  return new NextResponse("OK", { status: 200 });
}