import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "brand" | "teal" | "amber" | "neutral";

const VARIANTS: Record<BadgeVariant, string> = {
  brand: "bg-brand/10 text-brand-dark",
  teal: "bg-teal/10 text-teal-dark",
  amber: "bg-amber/15 text-amber-700",
  neutral: "bg-slate-100 text-slate-600",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "brand", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
