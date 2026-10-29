import { beforeEach, describe, expect, it, vi } from "vitest";

const { transcribeAudio, textToSpeech } = vi.hoisted(() => ({
  transcribeAudio: vi.fn(),
  textToSpeech: vi.fn(),
}));

vi.mock("@/lib/voice/stt", () => ({ transcribeAudio, transcribeAudioFromUrl: vi.fn() }));
vi.mock("@/lib/voice/tts", () => ({ textToSpeech, textToSpeechStream: vi.fn() }));

import { handleVoiceTurn, VoiceReceptionist, MAX_TURN_MS, AI_NOTICE, RECORDING_NOTICE } from "@/lib/voice/receptionist";

beforeEach(() => {
  transcribeAudio.mockReset();
  textToSpeech.mockReset();
  transcribeAudio.mockResolvedValue({ text: "hola, quiero agendar una hora", duration: 0.5 });
  textToSpeech.mockResolvedValue(Buffer.from("audio"));
});

describe("voice receptionist", () => {
  it("includes AI and recording notices", async () => {
    const res = await handleVoiceTurn({ audioBuffer: Buffer.from("x"), knowledgeBase: [] });
    expect(res.notices.ai).toContain("inteligencia artificial");
    expect(res.notices.recording).toBeTruthy();
    expect(res.aiNotice).toBeTruthy();
    expect(res.recordingNotice).toBeTruthy();
    expect(AI_NOTICE).toBeTruthy();
    expect(RECORDING_NOTICE).toBeTruthy();
  });

  it("transcribes and replies within 1.5s", async () => {
    const res = await handleVoiceTurn({ audioBuffer: Buffer.from("x"), knowledgeBase: [{ question: "horario", answer: "Lunes a sabado." }] });
    expect(transcribeAudio).toHaveBeenCalled();
    expect(textToSpeech).toHaveBeenCalled();
    expect(res.transcript).toContain("agendar");
    expect(res.durationMs).toBeLessThanOrEqual(MAX_TURN_MS);
    expect(res.withinBudget).toBe(true);
  });

  it("schedules an appointment without human intervention", async () => {
    transcribeAudio.mockResolvedValue({ text: "quiero agendar una hora mañana a las 10", duration: 0.4 });
    const res = await handleVoiceTurn({ audioBuffer: Buffer.from("x") });
    expect(res.scheduled).toBe(true);
    expect(res.humanIntervention).toBe(false);
    expect(res.appointment).toBeTruthy();
  });

  it("works via VoiceReceptionist class", async () => {
    const r = new VoiceReceptionist({ knowledgeBase: [] });
    const res = await r.turn({ audioBuffer: Buffer.from("x") });
    expect(res.ok).toBe(true);
  });
});