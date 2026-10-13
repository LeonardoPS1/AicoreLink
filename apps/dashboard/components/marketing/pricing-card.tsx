import { Check } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCLP, type Plan } from "@/lib/marketing/copy";

interface Props {
  plan: Plan;
}

export function PricingCard({ plan }: Props) {
  return (
    <article
      data-plan={plan.id}
      data-highlighted={plan.highlighted ? "true" : "false"}
      className={cn(
        "lift relative flex h-full flex-col rounded-2xl border bg-white p-6 sm:p-7",
        plan.highlighted
          ? "border-teal/40 shadow-[0_24px_60px_-32px_rgba(13,148,136,0.55)] ring-1 ring-teal/30 lg:-mt-4 lg:mb-4"
          : "border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
      )}
    >
      {plan.badge && (
        <span
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm",
            plan.highlighted ? "bg-teal-dark" : "bg-navy",
          )}
        >
          {plan.badge}
        </span>
      )}

      <header className="mt-2">
        <h3 className="text-lg font-semibold text-navy">{plan.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{plan.forWho}</p>
        <p className="mt-5 flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-tight text-navy">
            {formatCLP(plan.priceCLP)}
          </span>
          <span className="text-sm font-medium text-slate-500">/ mes</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">{plan.priceNote}</p>
      </header>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                plan.highlighted ? "bg-teal/10 text-teal-dark" : "bg-brand/10 text-brand",
              )}
            >
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <a
        href="#contacto"
        data-track="cta_click"
        data-label={`planes-${plan.id}`}
        className={buttonClasses(plan.highlighted ? "primary" : "secondary", "lg", "mt-7 w-full")}
      >
        {plan.ctaLabel}
      </a>
    </article>
  );
}
