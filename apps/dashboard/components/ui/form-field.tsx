import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Shared styling for input/select/textarea; pass through `cn` to override on error. */
export const controlClasses = cn(
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-navy",
  "shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-400",
  "transition-[border-color,box-shadow] duration-150 ease-out",
  "hover:border-slate-400",
  "focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
);

interface Props {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({ id, label, error, hint, className, children }: Props) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-navy">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
