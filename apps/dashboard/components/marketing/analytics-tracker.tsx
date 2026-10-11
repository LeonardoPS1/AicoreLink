"use client";

import { useEffect } from "react";

import { trackEvent, type AnalyticsEventName } from "@/lib/analytics";

/**
 * One delegated listener for the whole marketing site, mounted once in the
 * layout. It turns two conventions into events without making Server
 * Components client:
 *
 * - `a[data-track]` → generic event: `data-track` is the event name and
 *   `data-label` a free-form label ("hero", "planes-growth", ...).
 * - `a[href^="https://wa.me/"]` → `whatsapp_click`, labelled with `data-label`
 *   when present, otherwise with the id of the closest section, otherwise
 *   "unknown".
 *
 * Renders nothing.
 */
export function AnalyticsTracker() {
  useEffect(() => {
    function labelFor(el: Element): string | undefined {
      const own = el.getAttribute("data-label");
      if (own) return own;

      const section = el.closest("section[id], header[id], footer[id]");
      return section?.id ?? undefined;
    }

    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      if (!target || typeof target.closest !== "function") return;

      const tracked = target.closest<HTMLElement>("[data-track]");
      if (tracked) {
        const name = tracked.getAttribute("data-track") as AnalyticsEventName | null;
        if (name) {
          trackEvent(name, { label: labelFor(tracked) });
          return;
        }
      }

      const whatsapp = target.closest<HTMLAnchorElement>('a[href^="https://wa.me/"]');
      if (whatsapp) {
        trackEvent("whatsapp_click", { label: labelFor(whatsapp) ?? "unknown" });
      }
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}