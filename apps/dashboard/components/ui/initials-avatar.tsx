import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InitialsAvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  className?: string;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0][0] ?? "";
    const last = parts[parts.length - 1][0] ?? "";
    if (first && last) return (first + last).toUpperCase();
  }
  return trimmed.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g, "").slice(0, 2).toUpperCase() || trimmed.slice(0, 2).toUpperCase();
}

const COLORS = [
  "bg-brand/10 text-brand-dark",
  "bg-teal/10 text-teal-dark",
  "bg-amber/15 text-amber-700",
  "bg-slate-100 text-slate-600",
];

export function InitialsAvatar({ name, className, ...props }: InitialsAvatarProps) {
  const initials = getInitials(name);
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = COLORS[Math.abs(hash) % COLORS.length];

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
        color,
        className,
      )}
      {...props}
    >
      {initials}
    </div>
  );
}
