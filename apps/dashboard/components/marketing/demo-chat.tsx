"use client";

import { useRef, useState, type FormEvent } from "react";

import { WhatsAppGlyph } from "@/components/marketing/whatsapp-glyph";
import { Button, buttonClasses } from "@/components/ui/button";
import { FormField, controlClasses } from "@/components/ui/form-field";
import { DEMO_BUSINESSES } from "@/lib/demos/knowledge";
import { DEMO_RUBROS, type DemoRubro } from "@/lib/demos/schema";
import { copy, presetWhatsappUrl } from "@/lib/marketing/copy";

type ChatRole = "assistant" | "user";

interface ChatMessage {
  role: ChatRole;
  text: string;
}

type ChatStatus = "idle" | "loading" | "rate_limited" | "error";

const INITIAL_RUBRO: DemoRubro = "peluqueria";

/** Stable per-visitor id sent as metadata. Never a rate-limit dimension (R17). */
function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 64);
  }

  return `demo-${Math.random().toString(36).slice(2, 12)}`;
}

function greetingFor(rubro: DemoRubro): ChatMessage[] {
  return [{ role: "assistant", text: DEMO_BUSINESSES[rubro].greeting }];
}

/**
 * History for the model: the turns already rendered, oldest to newest, capped at
 * the last 8 (ruling R21). On a retry the pending message is already rendered as a
 * user turn, so an identical trailing turn is dropped to avoid sending it twice.
 */
function historyFor(
  pending: string,
  rendered: ChatMessage[],
): Array<{ role: ChatRole; content: string }> {
  const turns = [...rendered];
  const last = turns[turns.length - 1];

  if (last && last.role === "user" && last.text === pending) {
    turns.pop();
  }

  return turns.slice(-8).map((turn) => ({ role: turn.role, content: turn.text }));
}

/**
 * Public live chat demo. The visitor picks one of four demo businesses, sends a
 * message and a real local model answers grounded only in that business's
 * knowledge base. The heavy lifting (knowledge, guardrails, rate limit) lives in
 * the API route; this component only renders the conversation and surfaces the
 * 429 / error states.
 */
export function DemoChat() {
  const [rubro, setRubro] = useState<DemoRubro>(INITIAL_RUBRO);
  const [messages, setMessages] = useState<ChatMessage[]>(() => greetingFor(INITIAL_RUBRO));
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [lastAttempt, setLastAttempt] = useState("");

  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function sessionId(): string {
    if (!sessionIdRef.current) {
      sessionIdRef.current = createSessionId();
    }
    return sessionIdRef.current;
  }

  function selectRubro(next: DemoRubro) {
    if (next === rubro) return;

    abortRef.current?.abort();
    abortRef.current = null;

    setRubro(next);
    setMessages(greetingFor(next));
    setInput("");
    setLastAttempt("");
    setStatus("idle");
  }

  async function submit(text: string, echo: boolean) {
    const trimmed = text.trim();

    if (!trimmed || status === "loading") return;

    if (echo) {
      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    }

    setLastAttempt(trimmed);
    setInput("");
    setStatus("loading");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/demos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rubro,
          message: trimmed,
          sessionId: sessionId(),
          history: historyFor(trimmed, messages),
        }),
        signal: controller.signal,
      });

      if (response.status === 429) {
        setStatus("rate_limited");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const data = (await response.json()) as { reply?: string };

      if (!data.reply) {
        setStatus("error");
        return;
      }

      const reply = data.reply;
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setStatus("idle");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("error");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(input, true);
  }

  const busy = status === "loading";
  const showRetry = (status === "rate_limited" || status === "error") && lastAttempt.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] sm:p-8">
      <p className="rounded-xl border border-teal/25 bg-teal/5 p-3 text-xs text-slate-600">
        {copy.demoChat.notice}
      </p>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-navy">{copy.demoChat.rubroLabel}</legend>

        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_RUBROS.map((option, index) => {
            const selected = option === rubro;

            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                // Analytics hook prepared for E1.7 (owner of the funnel wiring):
                // touching the first chip marks the start of the demo.
                data-track={index === 0 ? "tools_start" : undefined}
                onClick={() => selectRubro(option)}
                className={buttonClasses(selected ? "primary" : "secondary", "sm")}
              >
                {DEMO_BUSINESSES[option].label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-6 text-sm font-medium text-navy">
        {DEMO_BUSINESSES[rubro].businessName}
      </p>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="mt-3 max-h-96 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "assistant"
                ? "motion-safe:animate-fade-up max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 text-sm text-slate-700 shadow-sm"
                : "motion-safe:animate-fade-up ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-brand p-3 text-sm text-white"
            }
          >
            {message.text}
          </div>
        ))}

        {busy ? (
          <p className="motion-safe:animate-fade-up max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 text-sm italic text-slate-500 shadow-sm">
            {copy.demoChat.thinkingLabel}
          </p>
        ) : null}
      </div>

      {status === "rate_limited" ? (
        <p role="alert" className="mt-3 text-sm font-medium text-amber-700">
          {copy.demoChat.rateLimited}
        </p>
      ) : null}

      {status === "error" ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {copy.demoChat.genericError}
        </p>
      ) : null}

      {showRetry ? (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => void submit(lastAttempt, false)}
        >
          {copy.demoChat.retryLabel}
        </Button>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500">{copy.demoChat.suggestionsLabel}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO_BUSINESSES[rubro].suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={busy}
              onClick={() => void submit(suggestion, true)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <FormField id="demo-message" label={copy.demoChat.inputLabel}>
          <input
            id="demo-message"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={copy.demoChat.inputPlaceholder}
            maxLength={300}
            autoComplete="off"
            className={controlClasses}
          />
        </FormField>

        <Button
          type="submit"
          className="mt-3 w-full"
          // Analytics hook prepared for E1.7.
          data-track="demo_message"
          disabled={busy || input.trim().length === 0}
        >
          {copy.demoChat.sendLabel}
        </Button>
      </form>

      <a
        href={presetWhatsappUrl("demo", { rubro: DEMO_BUSINESSES[rubro].label })}
        data-label="demo"
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses("secondary", "lg", "mt-4 w-full")}
      >
        <WhatsAppGlyph className="size-5" />
        {copy.demoChat.ctaLabel}
      </a>
    </div>
  );
}
