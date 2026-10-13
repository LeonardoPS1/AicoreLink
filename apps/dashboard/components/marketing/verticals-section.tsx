import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { VerticalTabs } from "@/components/marketing/vertical-tabs";
import type { TabItem } from "@/components/ui/tabs";
import { buttonClasses } from "@/components/ui/button";
import { copy } from "@/lib/marketing/copy";
import { verticals, type Vertical } from "@/lib/marketing/verticals";

function VerticalPanel({ vertical }: { vertical: Vertical }) {
  return (
    <div className="grid gap-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber">El problema</p>
        <p className="mt-3 text-lg font-medium leading-relaxed text-white">{vertical.pain}</p>
        <blockquote className="mt-5 border-l-2 border-teal/70 pl-4 text-sm italic leading-relaxed text-slate-300">
          {vertical.anchor}
        </blockquote>
      </div>

      <div className="flex flex-col">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-light">Con AicoreLink</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">{vertical.solution}</p>

        <div className="mt-6 inline-flex w-fit items-baseline gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-xl font-semibold text-white">{vertical.highlight.value}</span>
          <span className="text-xs text-slate-300">{vertical.highlight.label}</span>
        </div>

        <a
          href="#contacto"
          data-track="cta_click"
          data-label={`rubros-${vertical.id}`}
          className={buttonClasses("primary", "md", "mt-6 self-start")}
        >
          {vertical.ctaLabel}
        </a>
      </div>
    </div>
  );
}

export function VerticalsSection() {
  const items: TabItem[] = verticals.map((vertical) => ({
    id: vertical.id,
    label: vertical.tab,
    icon: vertical.icon,
    content: <VerticalPanel vertical={vertical} />,
  }));

  return (
    <section id="rubros" className="relative isolate overflow-hidden bg-navy-800 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionHeading
          eyebrow="Rubros"
          title={copy.verticals.title}
          subtitle={copy.verticals.subtitle}
          tone="dark"
        />

        <Reveal className="mt-12">
          <VerticalTabs items={items} ariaLabel="Rubros" />
        </Reveal>
      </div>
    </section>
  );
}
