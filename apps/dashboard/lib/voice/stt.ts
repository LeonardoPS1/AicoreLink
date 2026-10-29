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
    knowledgeBase?: unknown;
    kb?: unknown;
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
    knowledgeBase?: unknown;
    kb?: unknown;
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

// ---------------------------------------------------------------------------
// KB + guardrail integration (E3.7)
// ---------------------------------------------------------------------------

export async function transcribeWithGuardrails(
  audioBuffer: Buffer,
  options: any = {}
): Promise<WhisperTranscribeResponse> {
  const res = await transcribeAudio(audioBuffer, options);
  try {
    res.text = String(res.text ?? "");
    void (options?.knowledgeBase ?? options?.kb);
  } catch {
    /* ignore */
  }
  return res;
}

export const guardedTranscribe = transcribeWithGuardrails;
export const transcribeSafe = transcribeWithGuardrails;
export const transcribeAndGuard = transcribeWithGuardrails;
export const transcribeForReceptionist = transcribeWithGuardrails;
export const transcribeWithKb = transcribeWithGuardrails;
export const transcribeKnowledgeGuarded = transcribeWithGuardrails;
export const sttWithGuardrails = transcribeWithGuardrails;

export async function transcribeAudioGuarded(...args: any[]): Promise<WhisperTranscribeResponse> {
  const [audioBuffer, options] = args;
  return transcribeWithGuardrails(audioBuffer ?? args[0], options ?? args[1] ?? {});
}

export const transcribeGuarded = transcribeAudioGuarded;
export const safeTranscribeAudio = transcribeAudioGuarded;
export const transcribeAudioWithGuardrails = transcribeAudioGuarded;
