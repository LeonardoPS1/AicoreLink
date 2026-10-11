"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  /** Accessible name for the tablist. */
  ariaLabel: string;
  defaultId?: string;
  tone?: "light" | "dark";
  className?: string;
}

export function Tabs({ items, ariaLabel, defaultId, tone = "light", className }: TabsProps) {
  const uid = useId();
  const [activeId, setActiveId] = useState(defaultId ?? items[0]?.id ?? "");
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);

  function moveTo(index: number) {
    if (items.length === 0) return;
    const next = (index + items.length) % items.length;
    setActiveId(items[next].id);
    triggers.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(index - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(items.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          "inline-flex flex-wrap justify-center gap-1 rounded-xl p-1",
          tone === "dark" ? "bg-white/5" : "bg-slate-100",
        )}
      >
        {items.map((item, index) => {
          const selected = item.id === activeId;

          return (
            <button
              key={item.id}
              ref={(element) => {
                triggers.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${uid}-${item.id}-tab`}
              aria-selected={selected}
              aria-controls={`${uid}-${item.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                selected
                  ? tone === "dark"
                    ? "bg-white text-navy shadow-sm"
                    : "bg-white text-navy shadow-sm"
                  : tone === "dark"
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-600 hover:text-navy",
              )}
            >
              {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${uid}-${item.id}-panel`}
          aria-labelledby={`${uid}-${item.id}-tab`}
          hidden={item.id !== activeId}
          tabIndex={0}
          className="mt-8 focus-visible:outline-none"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
