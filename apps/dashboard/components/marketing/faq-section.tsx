import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { copy } from "@/lib/marketing/copy";

export function FaqSection() {
  const items: AccordionItem[] = copy.faq.items.map((item, index) => ({
    id: `faq-${index}`,
    question: item.question,
    answer: item.answer,
  }));

  return (
    <section id="preguntas" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <SectionHeading
          eyebrow="Dudas"
          title={copy.faq.title}
          subtitle={copy.faq.subtitle}
        />
        <Reveal className="mt-12">
          <Accordion items={items} defaultOpenId="faq-0" />
        </Reveal>
      </div>
    </section>
  );
}
