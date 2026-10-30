import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Twilio Voice webhook - handles incoming calls and voice notes
// Returns TwiML for voice responses

export async function GET(req: NextRequest) {
  // Twilio voice URL verification
  return NextResponse.json({ status: "ok", service: "voice-receptionist" });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const callSid = formData.get("CallSid")?.toString() ?? "";
  const from = formData.get("From")?.toString() ?? "";
  const to = formData.get("To")?.toString() ?? "";
  const recordingUrl = formData.get("RecordingUrl")?.toString();
  const speechResult = formData.get("SpeechResult")?.toString();

  // Find tenant by phone number
  const cred = await db.channelCredential.findFirst({
    where: { externalId: to, channel: "whatsapp_voice" },
  });
  const tenantId = cred?.tenantId;

  if (!tenantId) {
    // Default TwiML response
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-ES">Hola, gracias por llamar. En este momento no podemos atender su llamada. Le enviaremos un mensaje por WhatsApp. Hasta pronto.</Say>
</Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Get assistant config for greeting
  const assistant = await db.assistantConfig.findUnique({
    where: { tenantId },
  });
  const greeting = assistant?.greeting ?? "Hola, gracias por llamar. ¿En qué puedo ayudarle?";

  // Check for transcription result
  const transcriptionText = formData.get("TranscriptionText")?.toString();
  const transcriptionStatus = formData.get("TranscriptionStatus")?.toString();

  // If there's a recording, store voice note
  if (recordingUrl) {
    const conversation = await db.conversation.findFirst({
      where: { tenantId, contactRef: from, channel: "whatsapp_voice" },
    });
    if (conversation) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          tenantId,
          direction: "in",
          content: transcriptionText ? `[Voice note transcribed] ${transcriptionText}` : `[Voice note] ${recordingUrl}`,
          mediaType: "voice",
          audioUrl: recordingUrl,
        },
      });
    }

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-ES">${greeting} Hemos recibido su mensaje de voz y le responderemos pronto por WhatsApp.</Say>
  <Hangup/>
</Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // If speech result (speech-to-text), process it
  if (speechResult) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-ES">Entendido. ${greeting}</Say>
  <Gather input="speech" timeout="5" action="/api/webhooks/voice">
    <Say language="es-ES">Por favor, dígame en qué puedo ayudarle.</Say>
  </Gather>
</Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }

  // Initial greeting with gather
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="5" action="/api/webhooks/voice">
    <Say language="es-ES">${greeting}</Say>
  </Gather>
  <Say language="es-ES">No escuchamos nada. Adiós.</Say>
  <Hangup/>
</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}