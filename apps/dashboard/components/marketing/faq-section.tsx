import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/marketing/copy";
import { CHAP, HEAD, SECTION, TONE, WRAP } from "@/lib/marketing/shell";

export function FaqSection() {
  const items: AccordionItem[] = copy.faq.items.map((item, index) => ({
    id: `faq-${index}`,
    question: item.question,
    answer: item.answer,
  }));

  return (
    <section id="preguntas" className={cn(SECTION, TONE.paper)}>
      <div className={WRAP}>
        <div className={HEAD}>
          <p className={CHAP}>Dudas</p>
          <h2>{copy.faq.title}</h2>
          <p>{copy.faq.subtitle}</p>
        </div>
        <Reveal className="mt-12">
          <Accordion items={items} defaultOpenId="faq-0" />
        </Reveal>
      </div>
    </section>
  );
}
