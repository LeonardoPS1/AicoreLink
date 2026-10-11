import { Info } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { copy } from "@/lib/marketing/copy";

type Example = {
  icon: string;
  business: string;
  situation: string;
  outcome: string;
  capability: string;
};

const EXAMPLES: Example[] = [
  {
    icon: "💈",
    business: "Barbería",
    situation: "El dueño está cortando pelo y no puede mirar el teléfono.",
    outcome:
      "El asistente responde, muestra los horarios libres y confirma el turno por WhatsApp.",
    capability: "Atiende mientras trabajás",
  },
  {
    icon: "🔧",
    business: "Taller mecánico",
    situation: "Entran consultas de presupuesto durante toda la jornada.",
    outcome:
      "La IA toma los datos del vehículo y el problema, y agenda la revisión en el taller.",
    capability: "Filtra consultas solo",
  },
  {
    icon: "⚖️",
    business: "Estudio jurídico",
    situation: "Llegan consultas que ocupan tiempo sin ser casos reales.",
    outcome:
      "El asistente hace las preguntas iniciales, ordena la información y deriva lo urgente.",
    capability: "Ordena tu agenda",
  },
];

export function TestimonialsSection() {
  return (
    <section id="casos" className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionHeading
          eyebrow="Casos"
          title={copy.testimonials.title}
          subtitle={copy.testimonials.subtitle}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {EXAMPLES.map((example, index) => (
            <Reveal key={example.business} delay={index * 70} className="h-full">
              <article
                data-example="true"
                className="lift flex h-full flex-col rounded-2xl border border-dashed border-slate-300 bg-white p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-11 place-items-center rounded-xl bg-slate-100 text-xl"
                  >
                    {example.icon}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                    Ejemplo
                  </span>
                </div>

                <h3 className="mt-5 text-base font-semibold text-navy">{example.business}</h3>
                <p className="mt-2 text-sm text-slate-500">{example.situation}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
                  {example.outcome}
                </p>

                <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-wide text-teal">
                  {example.capability}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <p className="mt-10 flex items-start justify-center gap-2.5 text-center text-sm text-slate-500">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <span>{copy.testimonials.placeholderNotice}</span>
        </p>
      </div>
    </section>
  );
}
