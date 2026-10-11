import { ArrowRight, ShieldCheck } from "lucide-react";

import { WhatsAppGlyph } from "@/components/marketing/whatsapp-glyph";
import { buttonClasses } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { copy, bookingUrl, whatsappUrl } from "@/lib/marketing/copy";

export function CtaSection() {
  return (
    <section id="contacto" className="relative isolate overflow-hidden bg-navy text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy to-navy-800" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]" />
        <div className="absolute -top-20 right-0 h-56 w-72 rounded-full bg-teal/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-20 text-center md:py-28">
        <Reveal>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {copy.cta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            {copy.cta.subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={bookingUrl}
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

          <p className="mt-7 inline-flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-teal-light" />
            {copy.cta.guarantee}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
