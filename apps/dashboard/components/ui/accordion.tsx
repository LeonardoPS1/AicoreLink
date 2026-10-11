"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Id of the item open on first paint; none by default. */
  defaultOpenId?: string | null;
  tone?: "light" | "dark";
  className?: string;
}

export function Accordion({ items, defaultOpenId = null, tone = "light", className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);
  const uid = useId();

  return (
    <div className={cn("divide-y", tone === "dark" ? "divide-white/10" : "divide-slate-200", className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        const triggerId = `${uid}-${item.id}-trigger`;
        const panelId = `${uid}-${item.id}-panel`;

        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 py-5 text-left text-base font-medium transition-colors duration-150",
                  tone === "dark"
                    ? "text-white hover:text-teal-light"
                    : "text-navy hover:text-brand",
                )}
              >
                <span>{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              data-state={isOpen ? "open" : "closed"}
              className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    "pb-5 text-base leading-relaxed",
                    tone === "dark" ? "text-slate-300" : "text-slate-600",
                  )}
                >
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
