import { ArrowRight, CalendarCheck, MessageCircle, Star } from "lucide-react";

import { Ticker } from "@/components/marketing/ticker";
import { buttonClasses } from "@/components/ui/button";
import { copy } from "@/lib/marketing/copy";
import { TONE, WRAP } from "@/lib/marketing/shell";
import { cn } from "@/lib/utils";

/** Splits the headline so the closing phrase can be rendered in italic. */
const commaIndex = copy.hero.headline.lastIndexOf(", ");
const headlineLead = copy.hero.headline.slice(0, commaIndex + 1);
const headlineAccent = copy.hero.headline.slice(commaIndex + 2);

interface ThreadMessage {
  from: "client" | "ai";
  text: string;
}

/** Illustrative conversation shown in the hero mockup (presentational only). */
const MOCKUP: ThreadMessage[] = [
  { from: "client", text: "Hola, ¿tienen hora para hoy?" },
  { from: "ai", text: "¡Hola! Sí 😊 Me quedan 15:30 y 17:00 con Martín. ¿Cuál te viene mejor?" },
  { from: "client", text: "15:30" },
  { from: "ai", text: "¡Listo! Hora confirmada ✅ Te mando un recordatorio mañana." },
];

export function HeroSection() {
  return (
    <section id="que-es" className={cn("relative isolate overflow-hidden", TONE.night)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-night via-night to-nightDeep" />
        <div
          className="absolute inset-0 opacity-[0.12] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(230,238,251,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(230,238,251,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute -top-40 left-1/4 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-action/25 blur-[120px]" />
        <div className="absolute -bottom-44 right-0 h-[26rem] w-[26rem] rounded-full bg-signal/15 blur-[120px]" />
      </div>

      <div className={cn(WRAP, "grid items-center gap-14 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-28")}>
        <div>
          <p className="animate-fade-up inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-signal sm:text-[13px]">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-signal" />
            {copy.hero.eyebrow}
          </p>

          <h1 className="animate-fade-up mt-6 text-balance font-display text-[clamp(2.8rem,6.4vw,5.25rem)] font-normal leading-[1.02] tracking-tight text-onDark">
            {headlineLead}{" "}
            <span className="italic text-signal">{headlineAccent}</span>
          </h1>

          <p className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-onDarkMuted sm:text-lg [animation-delay:80ms]">
            {copy.hero.subhead}
          </p>

          <p className="animate-fade-up mt-8 text-sm font-semibold text-onDark [animation-delay:120ms]">
            {copy.hero.askLabel}
          </p>

          <div
            role="group"
            aria-label={copy.hero.askLabel}
            className="animate-fade-up mt-3 flex flex-wrap gap-2 [animation-delay:140ms]"
          >
            {copy.hero.chips.map((chip, index) => (
              <button
                key={chip.id}
                type="button"
                data-rubro={chip.id}
                aria-pressed={index === 0}
                className="chip"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row sm:items-center [animation-delay:160ms]">
            <a href="#contacto" data-track="cta_click" data-label="hero" className={buttonClasses("primary", "lg")}>
              {copy.hero.primaryCta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <a
              href="#como-funciona"
              className={buttonClasses(
                "ghost",
                "lg",
                "border border-white/20 text-onDark hover:border-white/40 hover:bg-white/10 hover:text-white",
              )}
            >
              {copy.hero.secondaryCta}
            </a>
          </div>

          <p className="animate-fade-up mt-4 text-sm text-onDarkMuted [animation-delay:200ms]">{copy.hero.micro}</p>

          <p className="animate-fade-up mt-6 max-w-xl text-xs leading-relaxed text-onDarkMuted/80 [animation-delay:220ms]">
            {copy.hero.trustLine}
          </p>
        </div>

        <div className="relative">
          <div aria-hidden="true" className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-signal/10 blur-3xl" />

          <div className="animate-float-slow rounded-[1.75rem] border border-white/10 bg-night2/70 p-3 shadow-[0_35px_80px_-40px_rgba(2,6,23,0.9)]">
            <div className="rounded-[1.4rem] bg-nightDeep/70 p-4">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-action text-sm font-semibold text-white">
                    B
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-onDark">Barbería Fénix</p>
                    <p className="text-[11px] text-onDarkMuted">{copy.hero.chatExampleLabel}</p>
                  </div>
                </div>
                <span className="hidden items-center gap-1.5 rounded-full bg-signal/15 px-2.5 py-1 text-[11px] font-medium text-signal sm:inline-flex">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-signal" />
                  Responde en segundos
                </span>
              </div>

              <ul className="mt-4 space-y-3">
                {MOCKUP.map((message, index) => (
                  <li
                    key={`${message.from}-${index}`}
                    className={cn("flex", message.from === "ai" ? "justify-end" : "justify-start")}
                  >
                    <p
                      className={cn(
                        "max-w-[86%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
                        message.from === "ai"
                          ? "rounded-br-md bg-action text-white"
                          : "rounded-bl-md bg-white/10 text-onDark",
                      )}
                    >
                      {message.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="absolute -left-3 bottom-12 hidden w-44 rounded-xl border border-white/10 bg-night2 p-3 shadow-[0_18px_40px_-18px_rgba(2,6,23,0.9)] sm:block">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="grid size-7 place-items-center rounded-lg bg-action/20 text-signal">
                <MessageCircle className="size-4" />
              </span>
              <p className="text-[11px] font-semibold text-onDark">Nuevo contacto</p>
            </div>
            <p className="mt-2 text-[11px] text-onDarkMuted">Marcos · consultó por una hora</p>
          </div>

          <div className="absolute -right-2 top-8 hidden w-40 rounded-xl border border-white/10 bg-night2 p-3 shadow-[0_18px_40px_-18px_rgba(2,6,23,0.9)] sm:block">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="grid size-7 place-items-center rounded-lg bg-gold/15 text-gold">
                <Star className="size-4" />
              </span>
              <p className="text-[11px] font-semibold text-onDark">Nueva reseña</p>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-onDarkMuted">
              5.0 en Google
              <CalendarCheck className="size-3.5 text-signal" />
            </p>
          </div>
        </div>
      </div>

      <div className={cn(WRAP, "relative pb-16 md:pb-20")}>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="hero-thread">
          {copy.hero.thread.map((step, index) => (
            <li
              key={step.label}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full bg-signal/15 text-xs font-semibold text-signal"
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-onDark">{step.label}</p>
                <span aria-hidden="true" className="mt-2 block h-px w-8 bg-signal/50" />
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Ticker />
    </section>
  );
}
