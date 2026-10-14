import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center", className)}>
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
            <Icon className="h-5 w-5 text-brand-dark" aria-hidden="true" />
          </div>
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
