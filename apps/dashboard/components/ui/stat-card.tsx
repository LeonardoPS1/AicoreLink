import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type StatCardTone = "neutral" | "brand" | "amber" | "teal";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatCardTone;
  hint?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  className,
  ...props
}: StatCardProps) {
  const toneClasses: Record<StatCardTone, string> = {
    neutral: "border-slate-200 bg-white text-slate-700",
    brand: "border-brand/30 bg-brand/10 text-brand-dark",
    amber: "border-amber/40 bg-amber/15 text-amber-700",
    teal: "border-teal/30 bg-teal/10 text-teal-dark",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span className="text-2xl font-semibold">{value}</span>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
    </div>
  );
}
