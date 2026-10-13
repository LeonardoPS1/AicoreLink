import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { textToSpeech } = vi.hoisted(() => ({ textToSpeech: vi.fn() }));
const { transcribeAudio } = vi.hoisted(() => ({ transcribeAudio: vi.fn() }));

// Mock the voice modules — no real ElevenLabs/Whisper calls in tests (R30)
vi.mock("@/lib/voice/tts", () => ({ textToSpeech }));
vi.mock("@/lib/voice/stt", () => ({ transcribeAudio }));

const { POST } = await import("@/app/api/demos/voice/route");

const VALID_SCRIPT_ES =
  "Hola, gracias por llamar a AicoreLink. Soy tu recepcionista de voz con inteligencia artificial. Puedo agendar citas, responder preguntas frecuentes y tomar mensajes para tu equipo. ¿En qué te ayudo hoy?";
const VALID_SCRIPT_EN =
  "Hello, thanks for calling AicoreLink. I'm your AI voice receptionist. I can book appointments, answer FAQs, and take messages for your team. How can I help you today?";

function makeRequest(body: unknown, rawBody?: string) {
  return new NextRequest("https://aicorelink.aicorebots.com/api/demos/voice", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: rawBody ?? JSON.stringify(body),
  });
}

beforeEach(() => {
  textToSpeech.mockReset();
  transcribeAudio.mockReset();

  // R30: Mock TTS returns Buffer.from("mock-audio")
  textToSpeech.mockResolvedValue(Buffer.from("mock-audio"));

  // Mock STT returns the fixed script
  transcribeAudio.mockResolvedValue({
    text: VALID_SCRIPT_ES,
    language: "es",
    duration: 25.5,
  });
});

describe("POST /api/demos/voice", () => {
  it("returns audio base64 + transcript + notices for Spanish script", async () => {
    const response = await POST(makeRequest({ lang: "es" }));

    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      audioBase64: string;
      transcript: string;
      duration: number;
      script: string;
      notices: { ai: string; recording: string };
    };

    expect(data.audioBase64).toBe(Buffer.from("mock-audio").toString("base64"));
    expect(data.transcript).toBe(VALID_SCRIPT_ES);
    expect(data.duration).toBe(25.5);
    expect(data.script).toBe(VALID_SCRIPT_ES);
    expect(data.notices.ai).toBe("Estás interactuando con una inteligencia artificial. Esta es una demostración.");
    expect(data.notices.recording).toBe("Esta demostración genera audio y transcripción con fines de evaluación. No se almacena tu voz.");

    expect(textToSpeech).toHaveBeenCalledTimes(1);
    expect(textToSpeech).toHaveBeenCalledWith(VALID_SCRIPT_ES);
    expect(transcribeAudio).toHaveBeenCalledTimes(1);
    expect(transcribeAudio).toHaveBeenCalledWith(Buffer.from("mock-audio"));
  });

  it("returns audio base64 + transcript + notices for English script (optional)", async () => {
    transcribeAudio.mockResolvedValue({
      text: VALID_SCRIPT_EN,
      language: "en",
      duration: 24.0,
    });

    const response = await POST(makeRequest({ lang: "en" }));

    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      audioBase64: string;
      transcript: string;
      duration: number;
      script: string;
      notices: { ai: string; recording: string };
    };

    expect(data.transcript).toBe(VALID_SCRIPT_EN);
    expect(data.script).toBe(VALID_SCRIPT_EN);
    expect(textToSpeech).toHaveBeenCalledWith(VALID_SCRIPT_EN);
  });

  it("handles TTS failure with 500", async () => {
    textToSpeech.mockRejectedValue(new Error("ElevenLabs error: 500 Internal Server Error"));

    const response = await POST(makeRequest({ lang: "es" }));

    expect(response.status).toBe(500);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBe("La demo de voz no está disponible en este momento. Prueba más tarde.");
  });

  it("handles STT failure with 500", async () => {
    transcribeAudio.mockRejectedValue(new Error("Whisper error: 500 Internal Server Error"));

    const response = await POST(makeRequest({ lang: "es" }));

    expect(response.status).toBe(500);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBe("La demo de voz no está disponible en este momento. Prueba más tarde.");
  });

  it("validates lang enum (es|en) -> 400 on invalid", async () => {
    const response = await POST(makeRequest({ lang: "fr" }));

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string; fields: Record<string, string[]> };
    expect(data.error).toBe("Revisa los datos enviados.");
    expect(data.fields.lang).toBeDefined();
  });

  it("defaults to Spanish when lang is omitted", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(200);
    expect(textToSpeech).toHaveBeenCalledWith(VALID_SCRIPT_ES);
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(makeRequest(null, "<html>not json</html>"));

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBe("El cuerpo de la solicitud no es JSON válido.");
  });
});