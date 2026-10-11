import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { copy } from "@/lib/marketing/copy";

export function SolutionSection() {
  return (
    <section id="solucion" className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionHeading eyebrow="La solución" title={copy.solution.title} subtitle={copy.solution.subtitle} />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {copy.solution.columns.map((column, index) => (
            <Reveal key={column.title} delay={index * 70}>
              <article className="lift relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <span
                  aria-hidden="true"
                  className="absolute right-6 top-5 select-none text-4xl font-semibold text-slate-100"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span
                  aria-hidden="true"
                  className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-brand/[0.12] to-teal/[0.12] text-2xl ring-1 ring-inset ring-brand/10"
                >
                  {column.icon}
                </span>

                <h3 className="mt-6 text-lg font-semibold text-navy">{column.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{column.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
