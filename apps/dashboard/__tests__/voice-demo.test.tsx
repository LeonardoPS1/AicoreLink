import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VoiceDemo } from "@/components/marketing/voice-demo";
import { copy, presetWhatsappUrl } from "@/lib/marketing/copy";

const MOCK_AUDIO_BASE64 = Buffer.from("mock-audio").toString("base64");
const MOCK_RESPONSE = {
  audioBase64: MOCK_AUDIO_BASE64,
  transcript:
    "Hola, gracias por llamar a AicoreLink. Soy tu recepcionista de voz con inteligencia artificial. Puedo agendar citas, responder preguntas frecuentes y tomar mensajes para tu equipo. ¿En qué te ayudo hoy?",
  duration: 25.5,
  script:
    "Hola, gracias por llamar a AicoreLink. Soy tu recepcionista de voz con inteligencia artificial. Puedo agendar citas, responder preguntas frecuentes y tomar mensajes para tu equipo. ¿En qué te ayudo hoy?",
  notices: {
    ai: "Estás interactuando con una inteligencia artificial. Esta es una demostración.",
    recording: "Esta demostración genera audio y transcripción con fines de evaluación. No se almacena tu voz.",
  },
};

function mockFetchSuccess() {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
    ok: true,
    status: 200,
    json: async () => MOCK_RESPONSE,
  }));

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function mockFetchFailure() {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
    ok: false,
    status: 500,
    json: async () => ({ error: "Server error" }),
  }));

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("VoiceDemo", () => {
  it("renders button, shows loading, then audio player + transcript + notices", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();

    render(<VoiceDemo />);

    // Initial state: button visible
    const button = screen.getByRole("button", { name: copy.voiceDemo.listenLabel });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    // Click button
    await user.click(button);

    // Wait for ready state (loading state is brief with mocked fetch)
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Resultado de la demo de voz" })).toBeInTheDocument();
    });

    // Audio player present
    const audio = screen.getByRole("region", { name: "Resultado de la demo de voz" }).querySelector("audio");
    expect(audio).toBeInTheDocument();

    // Transcript present
    expect(screen.getByText(copy.voiceDemo.transcriptLabel)).toBeInTheDocument();
    expect(screen.getByText(MOCK_RESPONSE.transcript)).toBeInTheDocument();

    // Notices present (in badges within result container)
    const resultContainer = screen.getByRole("region", { name: "Resultado de la demo de voz" });
    const result = within(resultContainer);
    expect(result.getByText(copy.voiceDemo.noticeAi)).toBeInTheDocument();
    expect(result.getByText(copy.voiceDemo.noticeRecording)).toBeInTheDocument();
  });

  it("audio src is data:audio/mpeg;base64,...", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();

    render(<VoiceDemo />);

    const button = screen.getByRole("button", { name: copy.voiceDemo.listenLabel });
    await user.click(button);

    await waitFor(() => {
      const audio = screen.getByRole("region", { name: "Resultado de la demo de voz" }).querySelector("audio");
      expect(audio).toHaveAttribute("src", `data:audio/mpeg;base64,${MOCK_AUDIO_BASE64}`);
    });
  });

  it("notices.ai and notices.recording are visible", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();

    render(<VoiceDemo />);

    const button = screen.getByRole("button", { name: copy.voiceDemo.listenLabel });
    await user.click(button);

    await waitFor(() => {
      const resultContainer = screen.getByRole("region", { name: "Resultado de la demo de voz" });
      const result = within(resultContainer);
      expect(result.getByText(copy.voiceDemo.noticeAi)).toBeInTheDocument();
      expect(result.getByText(copy.voiceDemo.noticeRecording)).toBeInTheDocument();
    });
  });

  it("whatsapp CTA href uses presetWhatsappUrl('demo', {rubro:'voz'})", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();

    render(<VoiceDemo />);

    const button = screen.getByRole("button", { name: copy.voiceDemo.listenLabel });
    await user.click(button);

    await waitFor(() => {
      const cta = screen.getByRole("link", { name: copy.voiceDemo.ctaLabel });
      expect(cta).toBeInTheDocument();
      const expectedHref = presetWhatsappUrl("demo", { rubro: "voz" });
      expect(cta.getAttribute("href")).toBe(expectedHref);
      expect(cta.getAttribute("target")).toBe("_blank");
      expect(cta.getAttribute("rel")).toBe("noopener noreferrer");
    });
  });

  it("data-track attributes present on button and result container", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();

    render(<VoiceDemo />);

    // Button has data-track="tools_start"
    const button = screen.getByRole("button", { name: copy.voiceDemo.listenLabel });
    expect(button).toHaveAttribute("data-track", "tools_start");

    await user.click(button);

    // Result container has data-track="tools_finish"
    await waitFor(() => {
      const resultContainer = screen.getByRole("region", { name: "Resultado de la demo de voz" });
      expect(resultContainer).toHaveAttribute("data-track", "tools_finish");
    });
  });

  it("shows error state on fetch failure", async () => {
    mockFetchFailure();
    const user = userEvent.setup();

    render(<VoiceDemo />);

    const button = screen.getByRole("button", { name: copy.voiceDemo.listenLabel });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(copy.voiceDemo.genericError)).toBeInTheDocument();
    });

    // Button should be re-enabled
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent(copy.voiceDemo.listenLabel);
  });
});