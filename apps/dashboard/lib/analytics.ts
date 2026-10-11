/**
 * Conversion analytics for the marketing site.
 *
 * The wrapper is provider-free on purpose: nothing is sent anywhere until a
 * provider is registered. The default provider logs to the console in
 * development (this is what the live verification in the plan exercises) and
 * compiles to a no-op in production builds, where NODE_ENV is constant.
 *
 * When a real destination is chosen (GA4, Plausible, a self-hosted endpoint),
 * implement one provider and register it from a client entry point.
 *
 * PRIVACY: events must never carry personal data. `form_submit` records only
 * the vertical; names, numbers and messages stay in the lead endpoint and are
 * never forwarded here.
 */

export type AnalyticsEventName = "cta_click" | "form_submit" | "whatsapp_click" | "vertical_view";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  /** Free-form label: which CTA, which screen. Required for cta_click. */
  label?: string;
  properties?: Record<string, string | number | boolean>;
}

export type AnalyticsProvider = (event: AnalyticsEvent) => void | Promise<void>;

let provider: AnalyticsProvider = (event) => {
  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", event);
  }
};

/** Registers a real provider; pass `null` to restore the dev/console default. */
export function setAnalyticsProvider(next: AnalyticsProvider | null): void {
  provider = next ?? ((event) => {
    if (process.env.NODE_ENV !== "production") {
      console.info("[analytics]", event);
    }
  });
}

/**
 * Records an event. Never throws and does nothing outside the browser, so it
 * is safe to call from shared code and from click handlers without changing
 * user-visible behavior.
 */
export function trackEvent(name: AnalyticsEventName, opts: Omit<AnalyticsEvent, "name"> = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  const event: AnalyticsEvent = { name, ...opts };

  try {
    void provider(event);
  } catch (error) {
    console.error("[analytics] provider failed", error);
  }
}

/** Primary call-to-action pressed, e.g. "hero", "planes-growth", "header". */
export function trackCtaClick(label: string): void {
  trackEvent("cta_click", { label });
}

/** Any link that opens a WhatsApp conversation. Context = where it lives. */
export function trackWhatsAppClick(context: string): void {
  trackEvent("whatsapp_click", { label: context });
}

/** Lead form completed successfully. Only the vertical travels with the event. */
export function trackFormSubmit(vertical?: string): void {
  trackEvent("form_submit", {
    properties: vertical ? { vertical } : undefined,
  });
}

/** Visitor switched to a rubro tab inside #rubros. */
export function trackVerticalView(verticalId: string): void {
  trackEvent("vertical_view", { label: verticalId });
}