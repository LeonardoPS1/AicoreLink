import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
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

/**
 * Verifica la firma del webhook N8N usando el secreto compartido.
 * Configura N8N_WEBHOOK_SECRET en las variables de entorno.
 * Si no está configurado, emite warning pero sigue procesando (modo desarrollo).
 */
function verifyN8nWebhookSignature(req: NextRequest, secret?: string): boolean {
  if (!secret) {
    console.warn(
      "[n8n/webhook] N8N_WEBHOOK_SECRET no configurado - firma no verificada"
    );
    return true; // En desarrollo, permitir pasar; en producción configurar secreto
  }

  const signature = req.headers.get("x-n8n-signature") ?? "";
  const body = req.body || "";
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(typeof body === "string" ? body : JSON.stringify(body))
    .digest("hex");

  // El signature de N8N puede venir con prefijo "sha256="
  const cleanSignature = signature.replace("sha256=", "");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(cleanSignature)
  );
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

    // Verify webhook signature if secret is configured
    const n8nWebhookSecret = process.env.N8N_WEBHOOK_SECRET;
    if (n8nWebhookSecret && !verifyN8nWebhookSignature(request, n8nWebhookSecret)) {
      console.warn("[n8n/webhook] Invalid webhook signature");
      return new NextResponse("Invalid signature", { status: 401 });
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