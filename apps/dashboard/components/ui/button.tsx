import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-safe:active:scale-[0.97]";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-dark hover:shadow-md",
  secondary: "border border-slate-300 bg-white text-navy hover:border-brand hover:text-brand",
  ghost: "text-navy hover:bg-slate-100",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

/**
 * Compose the class string for a button-like element. Exported so anchors and
 * `next/link` can adopt the same visual language without an `asChild` wrapper.
 */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}
