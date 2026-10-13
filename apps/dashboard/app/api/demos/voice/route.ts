import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { textToSpeech } from "@/lib/voice/tts";
import { transcribeAudio } from "@/lib/voice/stt";
import { copy } from "@/lib/marketing/copy";
import { z } from "zod";

export const dynamic = "force-dynamic";

const voiceDemoRequestSchema = z.object({
  lang: z.enum(["es", "en"]).optional().default("es"),
});

/**
 * POST /api/demos/voice — generates a voice demo with TTS + STT.
 *
 * R27: No rate limit (single asset, predictable cost).
 * R28: Generate audio on each request (no disk cache).
 * R29: Fixed script from copy.voiceDemo.script; accepts optional {lang?: "es"|"en"}.
 * R31: Mandatory notices in UI and JSON response.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no es JSON válido." },
      { status: 400 },
    );
  }

  const parsed = voiceDemoRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Revisa los datos enviados.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { lang } = parsed.data;
  const script = lang === "en" ? copy.voiceDemo.scriptEn : copy.voiceDemo.script;

  try {
    // R28: Generate audio on each request (no disk cache)
    const audioBuffer = await textToSpeech(script);

    // Transcribe the generated audio
    const { text: transcript, duration } = await transcribeAudio(audioBuffer);

    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({
      audioBase64,
      transcript,
      duration: duration ?? 0,
      script,
      notices: {
        ai: copy.voiceDemo.noticeAi,
        recording: copy.voiceDemo.noticeRecording,
      },
    });
  } catch (error) {
    console.error("[demos/voice] generation failed", error);

    return NextResponse.json(
      { error: "La demo de voz no está disponible en este momento. Prueba más tarde." },
      { status: 500 },
    );
  }
}