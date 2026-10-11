import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { copy } from "@/lib/marketing/copy";

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionHeading eyebrow="Cómo funciona" title={copy.howItWorks.title} subtitle={copy.howItWorks.subtitle} />

        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="absolute left-5 top-3 bottom-3 w-px bg-slate-200 md:hidden"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-5 hidden h-px bg-slate-200 md:block md:left-5 md:right-5"
          />

          <ol className="grid gap-8 md:grid-cols-4">
            {copy.howItWorks.steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-5 md:block">
                <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-navy text-sm font-semibold text-white ring-4 ring-white">
                  {index + 1}
                </span>
                <Reveal delay={index * 70} className="md:mt-6">
                  <h3 className="text-base font-semibold text-navy">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
