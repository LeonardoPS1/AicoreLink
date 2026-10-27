import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyN8nWebhookSignature } from "@/lib/n8n/signature";

interface N8nWebhookPayload {
  tenantId: string;
  phoneNumberId: string;
  contactRef: string;
  message: string;
  messageId: string;
  timestamp: number;
  mediaType: "text" | "audio";
  intent?: string;
  confidence?: number;
  escalated?: boolean;
  audioId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Read the raw body first so the signature can be verified over the exact
    // bytes that were sent (App Router exposes the body via request.text()).
    const rawBody = await request.text();

    const signature = request.headers.get("x-n8n-signature") ?? "";

    // Verify webhook signature if secret is configured
    const n8nWebhookSecret = process.env.N8N_WEBHOOK_SECRET;
    if (n8nWebhookSecret) {
      if (!verifyN8nWebhookSignature(rawBody, signature, n8nWebhookSecret)) {
        console.warn("[n8n/webhook] Invalid webhook signature");
        return new NextResponse("Invalid signature", { status: 401 });
      }
    } else {
      console.warn(
        "[n8n/webhook] N8N_WEBHOOK_SECRET no configurado - firma no verificada"
      );
      if (process.env.NODE_ENV === "production") {
        return new NextResponse("Invalid signature", { status: 401 });
      }
    }

    let payload: N8nWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as N8nWebhookPayload;
    } catch {
      return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
    }

    // Validate required fields
    if (!payload.tenantId || !payload.contactRef || !payload.messageId) {
      return NextResponse.json(
        { error: "Payload inválido: faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Persistir la clasificación IA en la conversación
    await db.conversation.upsert({
      where: { id: payload.contactRef },
      update: {
        escalado: payload.escalated ?? false,
      },
      create: {
        id: payload.contactRef,
        tenantId: payload.tenantId,
        channel: "whatsapp_text",
        contactRef: payload.contactRef,
        status: "abierta",
        escalado: payload.escalated ?? false,
      },
    });

    // Registrar el mensaje con la intención clasificada
    await db.message.create({
      data: {
        id: payload.messageId,
        conversationId: payload.contactRef,
        tenantId: payload.tenantId,
        direction: "in",
        content: payload.message,
        aiGenerated: true,
        tokensUsed: 0,
        mediaType: payload.mediaType,
        ...(payload.audioId && { audioUrl: payload.audioId }),
      },
    });

    // Aquí se podrían disparar workflows n8n automáticamente
    // Por ahora solo respondemos OK con los datos recibidos

    return NextResponse.json({
      status: "recibido",
      tenantId: payload.tenantId,
      messageId: payload.messageId,
      intent: payload.intent,
      confidence: payload.confidence,
      escalated: payload.escalated,
    });
  } catch (error) {
    console.error("[n8n/webhook] Error processing classification:", error);
    return NextResponse.json(
      { error: "Error interno al procesar clasificación" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "N8n webhook endpoint activo",
    methods: ["POST"],
  });
}

// Re-export for callers/tests that import from the route module.
export { verifyN8nWebhookSignature } from "@/lib/n8n/signature";
