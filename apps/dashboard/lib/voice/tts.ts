export interface ElevenLabsTTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
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