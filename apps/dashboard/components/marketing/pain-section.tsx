import { PainCard } from "@/components/marketing/pain-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { copy } from "@/lib/marketing/copy";

/** Cards 1-3 sit three-up; the last two span half the row each so the grid closes. */
const SPANS = [
  "sm:col-span-1 lg:col-span-2",
  "sm:col-span-1 lg:col-span-2",
  "sm:col-span-2 lg:col-span-2",
  "sm:col-span-2 lg:col-span-3",
  "sm:col-span-2 lg:col-span-3",
];

export function PainSection() {
  return (
    <section id="problema" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <SectionHeading
          eyebrow="El problema"
          title={copy.pains.title}
          subtitle={copy.pains.closing}
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {copy.pains.items.map((item, index) => (
            <Reveal key={item.title} delay={index * 60} className={SPANS[index] ?? "lg:col-span-2"}>
              <PainCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
