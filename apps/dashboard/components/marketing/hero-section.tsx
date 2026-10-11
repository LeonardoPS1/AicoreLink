import { ArrowRight, CalendarCheck, MessageCircle, Star } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";
import { copy } from "@/lib/marketing/copy";
import { cn } from "@/lib/utils";

const [headlineBefore, headlineAfter] = copy.hero.headline.split("24/7");

interface ThreadMessage {
  from: "client" | "ai";
  text: string;
}

/** Illustrative conversation shown in the hero mockup (presentational only). */
const THREAD: ThreadMessage[] = [
  { from: "client", text: "Hola, ¿tienen turno para hoy?" },
  { from: "ai", text: "¡Hola! Sí 😊 Me quedan 15:30 y 17:00 con Martín. ¿Cuál te viene mejor?" },
  { from: "client", text: "15:30" },
  { from: "ai", text: "¡Listo! Turno confirmado ✅ Te mando un recordatorio mañana." },
];

export function HeroSection() {
  return (
    <section id="que-es" className="relative isolate overflow-hidden bg-navy text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy to-navy-800" />
        <div
          className="absolute inset-0 opacity-[0.14] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute -top-40 left-1/4 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-brand/30 blur-[120px]" />
        <div className="absolute -bottom-44 right-0 h-[26rem] w-[26rem] rounded-full bg-teal/20 blur-[120px]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-28">
        <div>
          <p className="animate-fade-up inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-teal-light sm:text-[13px]">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-teal" />
            {copy.hero.eyebrow}
          </p>

          <h1 className="animate-fade-up mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem] [animation-delay:80ms]">
            {headlineBefore}
            <span className="text-gradient">24/7</span>
            {headlineAfter}
          </h1>

          <p className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg [animation-delay:160ms]">
            {copy.hero.subhead}
          </p>

          <div className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row sm:items-center [animation-delay:240ms]">
            <a href="#contacto" data-track="cta_click" data-label="hero" className={buttonClasses("primary", "lg")}>
              {copy.hero.primaryCta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <a
              href="#como-funciona"
              className={buttonClasses("ghost", "lg", "border border-white/20 text-white hover:bg-white/10")}
            >
              {copy.hero.secondaryCta}
            </a>
          </div>

          <p className="animate-fade-up mt-6 text-sm text-slate-400 [animation-delay:320ms]">
            {copy.hero.trustLine}
          </p>
        </div>

        <div aria-hidden="true" className="relative mx-auto w-full max-w-[21rem] lg:max-w-[23rem]">
          <div className="absolute inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand/40 to-teal/30 blur-3xl" />

          <div className="animate-float-slow relative rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-[0_40px_90px_-30px_rgba(2,6,23,0.95)] backdrop-blur">
            <div className="rounded-[1.6rem] bg-white p-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-teal text-sm font-semibold text-white">
                  A
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">Barbería El Corte</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Asistente con IA · en línea
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {THREAD.map((message, index) => (
                  <li
                    key={`${message.from}-${index}`}
                    className={cn("flex", message.from === "ai" ? "justify-end" : "justify-start")}
                  >
                    <p
                      className={cn(
                        "max-w-[86%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
                        message.from === "ai"
                          ? "rounded-br-md bg-teal text-white"
                          : "rounded-bl-md bg-slate-100 text-slate-700",
                      )}
                    >
                      {message.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="absolute -left-3 bottom-12 hidden w-44 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_40px_-18px_rgba(2,6,23,0.55)] sm:block">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-brand/10 text-brand">
                <MessageCircle className="size-4" />
              </span>
              <p className="text-[11px] font-semibold text-navy">Nuevo lead captado</p>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Marcos · consultó por un turno</p>
          </div>

          <div className="absolute -right-2 top-8 hidden w-40 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_40px_-18px_rgba(2,6,23,0.55)] sm:block">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-amber/10 text-amber">
                <Star className="size-4" />
              </span>
              <p className="text-[11px] font-semibold text-navy">Nueva reseña</p>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
              5.0 en Google
              <CalendarCheck className="size-3.5 text-teal" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
