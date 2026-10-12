import { PricingCard } from "@/components/marketing/pricing-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { copy } from "@/lib/marketing/copy";

export function PricingSection() {
  return (
    <section id="planes" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionHeading
          eyebrow="Planes"
          title={copy.pricing.title}
          subtitle={copy.pricing.subtitle}
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {copy.pricing.plans.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 70} className="h-full">
              <PricingCard plan={plan} />
            </Reveal>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
          {copy.pricing.note}
        </p>
      </div>
    </section>
  );
}
