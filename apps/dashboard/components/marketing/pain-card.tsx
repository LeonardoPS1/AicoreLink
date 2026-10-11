import type { PainItem } from "@/lib/marketing/copy";

export interface PainCardProps {
  item: PainItem;
}

export function PainCard({ item }: PainCardProps) {
  return (
    <article className="lift h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span
        aria-hidden="true"
        className="grid size-11 place-items-center rounded-xl bg-brand/[0.08] text-xl ring-1 ring-inset ring-brand/10"
      >
        {item.icon}
      </span>

      <h3 className="mt-5 text-base font-semibold text-navy">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
    </article>
  );
}
