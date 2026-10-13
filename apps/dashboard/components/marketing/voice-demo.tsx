"use client";

import { useState } from "react";

import { Button, buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { copy, presetWhatsappUrl } from "@/lib/marketing/copy";

type VoiceDemoStatus = "idle" | "loading" | "ready" | "error";

interface VoiceDemoResponse {
  audioBase64: string;
  transcript: string;
  duration: number;
  script: string;
  notices: {
    ai: string;
    recording: string;
  };
}

/**
 * Public voice demo component.
 *
 * Flow: idle → loading → ready (audio player + transcript + notices) → error.
 * R35: data-track="tools_start" on "Escuchar demo" button; data-track="tools_finish" on result container.
 * R36: WhatsApp CTA uses presetWhatsappUrl("demo", { rubro: "voz" }).
 */
export function VoiceDemo() {
  const [status, setStatus] = useState<VoiceDemoStatus>("idle");
  const [response, setResponse] = useState<VoiceDemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setStatus("loading");
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/demos/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lang: "es" }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate voice demo");
      }

      const data = (await res.json()) as VoiceDemoResponse;
      setResponse(data);
      setStatus("ready");
    } catch {
      setError(copy.voiceDemo.genericError);
      setStatus("error");
    }
  }

  const busy = status === "loading";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] sm:p-8">
      <Reveal>
        <p className="rounded-xl border border-amber/25 bg-amber/5 p-3 text-xs text-amber-800" role="status" aria-live="polite">
          {copy.voiceDemo.noticeAi}
        </p>
      </Reveal>

      <Reveal delay={60}>
        <div className="mt-6">
          <Button
            type="button"
            className="w-full"
            onClick={handleGenerate}
            disabled={busy}
            aria-busy={busy}
            // R35: Analytics hook for E1.7 — tools_start on the primary action
            data-track="tools_start"
          >
            {busy ? copy.voiceDemo.loadingLabel : copy.voiceDemo.listenLabel}
          </Button>
        </div>
      </Reveal>

      {status === "error" && (
        <Reveal delay={60}>
          <p role="alert" className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        </Reveal>
      )}

      {status === "ready" && response && (
        <Reveal delay={90}>
          {/* R35: data-track="tools_finish" on the result container */}
          <div data-track="tools_finish" className="mt-6 space-y-4" role="region" aria-live="polite" aria-label="Resultado de la demo de voz">
            {/* Audio player */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <audio
                controls
                src={`data:audio/mpeg;base64,${response.audioBase64}`}
                className="w-full"
                aria-label="Demo de voz generada con ElevenLabs"
              />
            </div>

            {/* Transcript */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-navy">{copy.voiceDemo.transcriptLabel}</p>
              <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{response.transcript}</p>
            </div>

            {/* Notices */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="amber">{copy.voiceDemo.noticeAi}</Badge>
              <Badge variant="neutral">{copy.voiceDemo.noticeRecording}</Badge>
            </div>
          </div>
        </Reveal>
      )}

      {/* WhatsApp CTA — always visible after the main action */}
      <Reveal delay={120}>
        <a
          href={presetWhatsappUrl("demo", { rubro: "voz" })}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("secondary", "lg", "mt-6 w-full")}
          // Analytics handled by delegated AnalyticsTracker via [data-label="demo"]
          data-label="demo"
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a19.856 19.856 0 0 1-7.263-1.97 19.44 19.44 0 0 1-5.572-5.893 19.865 19.865 0 0 1-1.775-7.076c.114-2.379 1.046-4.7 2.931-6.557a19.45 19.45 0 0 1 6.466-2.114c1.633.195 3.218.702 4.647 1.535a19.777 19.777 0 0 1 5.425 4.936c.662 1.515 1.044 3.107 1.076 4.738a20.218 20.218 0 0 1-2.583 9.399 19.68 19.68 0 0 1-7.312 2.227c-.658.057-1.317.085-1.977.085-.643 0-1.32-.043-1.958-.114z" />
          </svg>
          {copy.voiceDemo.ctaLabel}
        </a>
      </Reveal>
    </div>
  );
}