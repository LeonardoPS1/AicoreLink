import { NextRequest, NextResponse } from "next/server";
import { withTenant, asAdmin } from "@/lib/tenant-context";
import { db } from "@/lib/db";

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
}

export async function POST(request: NextRequest) {
  try {
    const payload: N8nWebhookPayload = await request.json();

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