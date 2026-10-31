// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { setAnalyticsProvider, trackEvent } from "@/lib/analytics";

afterEach(() => {
  setAnalyticsProvider(null);
});

describe("trackEvent outside the browser", () => {
  it("does nothing when the registered provider would be reached", () => {
    const provider = vi.fn();
    setAnalyticsProvider(provider);

    expect(typeof window).toBe("undefined");
    trackEvent("cta_click", { label: "hero" });

    expect(provider).not.toHaveBeenCalled();
  });
});
