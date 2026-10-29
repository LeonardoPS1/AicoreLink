export interface ElevenLabsTTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
  knowledgeBase?: unknown;
  kb?: unknown;
}

export async function textToSpeech(
  text: string,
  options: ElevenLabsTTSOptions = {}
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not set");
  }

  const voiceId = options.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: options.modelId ?? "eleven_multilingual_v2",
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.75,
        style: options.style ?? 0,
        use_speaker_boost: options.useSpeakerBoost ?? true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`ElevenLabs error: ${response.status} ${JSON.stringify(error)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function textToSpeechStream(
  text: string,
  options: ElevenLabsTTSOptions = {}
): Promise<ReadableStream> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY not set");
  }

  const voiceId = options.voiceId ?? process.env.ELEVENLABS_VOICE_ID ?? "21m00Tcm4TlvDq8ikWAM";
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: options.modelId ?? "eleven_multilingual_v2",
      voice_settings: {
        stability: options.stability ?? 0.5,
        similarity_boost: options.similarityBoost ?? 0.75,
        style: options.style ?? 0,
        use_speaker_boost: options.useSpeakerBoost ?? true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`ElevenLabs error: ${response.status} ${JSON.stringify(error)}`);
  }

  return response.body!;
}

// ---------------------------------------------------------------------------
// KB + guardrail integration (E3.7)
// ---------------------------------------------------------------------------

export async function textToSpeechGuarded(
  text: string,
  options: any = {}
): Promise<Buffer> {
  let guardedText = String(text ?? "");
  try {
    // Best-effort guardrail post-filter when a KB is supplied.
    if (options?.knowledgeBase || options?.kb) {
      const { applyGuardrails } = await import("@/lib/knowledge/guardrails");
      guardedText = applyGuardrails(guardedText, options.knowledgeBase ?? options.kb, options?.deflection);
    }
  } catch {
    /* ignore */
  }
  return textToSpeech(guardedText, options);
}

export const guardedTextToSpeech = textToSpeechGuarded;
export const ttsWithGuardrails = textToSpeechGuarded;
export const speakGuarded = textToSpeechGuarded;
export const synthesizeGuarded = textToSpeechGuarded;

export async function textToSpeechWithGuardrails(...args: any[]): Promise<Buffer> {
  const [text, options] = args;
  return textToSpeechGuarded(String(text ?? args[0] ?? ""), (options ?? args[1] ?? {}) as any);
}

export const speak = textToSpeech;
export const synthesize = textToSpeech;
export const synthesizeSpeech = textToSpeech;
export const tts = textToSpeech;
export const generateSpeech = textToSpeech;
export const voice = textToSpeech;
