export interface WhisperTranscribeResponse {
  text: string;
  language?: string;
  duration?: number;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  options: {
    language?: string;
    task?: "transcribe" | "translate";
    baseUrl?: string;
  } = {}
): Promise<WhisperTranscribeResponse> {
  const baseUrl = options.baseUrl ?? process.env.WHISPER_URL ?? "http://172.18.0.1:9000";
  const url = `${baseUrl}/asr`;

  const formData = new FormData();
  const uint8Array = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8Array], { type: "audio/ogg" });
  formData.append("audio_file", blob, "audio.ogg");
  formData.append("task", options.task ?? "transcribe");
  if (options.language) formData.append("language", options.language);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Whisper error: ${response.status} ${JSON.stringify(error)}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Whisper request timeout");
    }
    throw error;
  }
}

export async function transcribeAudioFromUrl(
  audioUrl: string,
  accessToken: string,
  options: {
    language?: string;
    baseUrl?: string;
  } = {}
): Promise<WhisperTranscribeResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(audioUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return transcribeAudio(audioBuffer, options);
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Audio download timeout");
    }
    throw error;
  }
}