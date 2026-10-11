import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const CARD_BASE =
  "rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

export function cardClasses(className?: string): string {
  return cn(CARD_BASE, className);
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cardClasses(className)} {...props} />;
}
