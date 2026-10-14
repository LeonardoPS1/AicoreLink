import dynamic from "next/dynamic";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { WhatsAppGlyph } from "@/components/marketing/whatsapp-glyph";
import { buttonClasses } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { copy, bookingUrl, whatsappUrl } from "@/lib/marketing/copy";

/**
 * The lead form (and its zod chunk) is the heaviest client module on the
 * landing. Loading it lazily keeps the form off the critical path: the rest of
 * the page hydrates first, then the form mounts. Server-side it renders the
 * skeleton below, so visitors see a stable layout either way.
 */
const LeadForm = dynamic(
  () => import("@/components/marketing/lead-form").then((mod) => mod.LeadForm),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="rounded-2xl border border-white/10 bg-white p-6 sm:p-8"
      >
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-28 animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-4 h-11 animate-pulse rounded-lg bg-slate-200" />
      </div>
    ),
  },
);

export function CtaSection() {
  return (
    <section id="contacto" className="relative isolate overflow-hidden bg-navy text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy to-navy-800" />
        <div className="absolute -bottom-24 left-1/4 h-72 w-[36rem] rounded-full bg-brand/25 blur-[120px]" />
        <div className="absolute -top-20 right-0 h-56 w-72 rounded-full bg-teal/15 blur-[120px]" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:py-28 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <Reveal>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {copy.cta.title}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
            {copy.cta.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={bookingUrl}
              data-track="cta_click"
              data-label="agendar-diagnostico"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("primary", "lg")}
            >
              {copy.cta.primaryLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <a
              href={whatsappUrl(copy.stickyWhatsApp.message)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses(
                "ghost",
                "lg",
                "border border-white/20 text-white hover:bg-white/10",
              )}
            >
              <WhatsAppGlyph className="size-5" />
              {copy.cta.secondaryLabel}
            </a>
          </div>

          <p className="mt-7 flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-teal-light" />
            {copy.cta.guarantee}
          </p>

          {/* Three-step next-list */}
          <div className="mt-8 grid grid-cols-3 gap-2">
            {copy.cta.steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center py-2 border rounded text-sm text-slate-300">
                <span className="font-medium text-slate-600">{i + 1}</span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={90}>
          <LeadForm />
        </Reveal>
      </div>
    </section>
  );
}
