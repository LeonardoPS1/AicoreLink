import { afterEach, describe, expect, it, vi } from "vitest";

import {
  setAnalyticsProvider,
  trackCtaClick,
  trackEvent,
  trackFormSubmit,
  trackVerticalView,
  trackWhatsAppClick,
  type AnalyticsEvent,
} from "@/lib/analytics";

function installMockProvider() {
  const provider = vi.fn<(event: AnalyticsEvent) => void>();
  setAnalyticsProvider(provider);
  return provider;
}

afterEach(() => {
  setAnalyticsProvider(null);
});

describe("trackEvent", () => {
  it("calls the registered provider with the full event", () => {
    const provider = installMockProvider();

    trackEvent("cta_click", { label: "hero" });

    expect(provider).toHaveBeenCalledTimes(1);
    expect(provider).toHaveBeenCalledWith({ name: "cta_click", label: "hero" });
  });

  it("keeps optional fields out of the event when absent", () => {
    const provider = installMockProvider();

    trackEvent("form_submit");

    expect(provider).toHaveBeenCalledWith({ name: "form_submit" });
  });

  it("swallows provider failures", () => {
    const provider = vi.fn(() => {
      throw new Error("collector down");
    });
    setAnalyticsProvider(provider);

    expect(() => trackEvent("whatsapp_click", { label: "sticky" })).not.toThrow();
  });

  it("does nothing outside the browser", () => {
    const provider = installMockProvider();
    const windowRef = globalThis.window;

    vi.stubGlobal("window", undefined);
    try {
      trackEvent("cta_click", { label: "hero" });
    } finally {
      vi.unstubAllGlobals();
    }

    expect(provider).not.toHaveBeenCalled();
    expect(globalThis.window).toBe(windowRef);
  });
});

describe("event helpers", () => {
  it("labels a CTA click", () => {
    const provider = installMockProvider();

    trackCtaClick("planes-growth");

    expect(provider).toHaveBeenCalledWith({ name: "cta_click", label: "planes-growth" });
  });

  it("labels a WhatsApp click with its context", () => {
    const provider = installMockProvider();

    trackWhatsAppClick("sticky");

    expect(provider).toHaveBeenCalledWith({ name: "whatsapp_click", label: "sticky" });
  });

  it("tracks a form submit without the vertical when unknown", () => {
    const provider = installMockProvider();

    trackFormSubmit();

    expect(provider).toHaveBeenCalledWith({ name: "form_submit" });
  });

  it("tracks a form submit with only the vertical (no personal data)", () => {
    const provider = installMockProvider();

    trackFormSubmit("barberia");

    expect(provider).toHaveBeenCalledWith({
      name: "form_submit",
      properties: { vertical: "barberia" },
    });
  });

  it("tracks a vertical tab switch", () => {
    const provider = installMockProvider();

    trackVerticalView("taller");

    expect(provider).toHaveBeenCalledWith({ name: "vertical_view", label: "taller" });
  });
});

describe("setAnalyticsProvider", () => {
  it("replaces the provider and restores the default on null", () => {
    const first = installMockProvider();

    trackCtaClick("hero");
    expect(first).toHaveBeenCalledTimes(1);

    const second = installMockProvider();
    trackCtaClick("planes-growth");
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});