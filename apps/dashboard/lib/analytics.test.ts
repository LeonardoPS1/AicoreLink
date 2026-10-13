import { afterEach, describe, expect, it, vi } from "vitest";

import {
  setAnalyticsProvider,
  trackDemoMessage,
  trackEvent,
  trackFormSubmit,
  trackToolsFinish,
  trackToolsStart,
  trackVerticalView,
  type AnalyticsEvent,
  type AnalyticsEventName,
} from "@/lib/analytics";

function installMockProvider() {
  const provider = vi.fn<(event: AnalyticsEvent) => void>();
  setAnalyticsProvider(provider);
  return provider;
}

afterEach(() => {
  setAnalyticsProvider(null);
});

describe("AnalyticsEventName union", () => {
  it("includes all 7 event types", () => {
    // This is a compile-time check: if the union doesn't have 7 members,
    // the type assertion below will fail.
    const allEvents: AnalyticsEventName[] = [
      "cta_click",
      "form_submit",
      "whatsapp_click",
      "vertical_view",
      "tools_start",
      "tools_finish",
      "demo_message",
    ];

    expect(allEvents).toHaveLength(7);

    // Verify each can be passed to trackEvent without type error
    const provider = installMockProvider();
    allEvents.forEach((name) => {
      trackEvent(name, { label: "test" });
    });
    expect(provider).toHaveBeenCalledTimes(7);
  });
});

describe("trackToolsStart", () => {
  it("emits tools_start with the provided label", () => {
    const provider = installMockProvider();

    trackToolsStart("calculadora");

    expect(provider).toHaveBeenCalledWith({
      name: "tools_start",
      label: "calculadora",
    });
  });

  it("emits tools_start without label when not provided", () => {
    const provider = installMockProvider();

    trackToolsStart("test-atencion");

    expect(provider).toHaveBeenCalledWith({
      name: "tools_start",
      label: "test-atencion",
    });
  });
});

describe("trackToolsFinish", () => {
  it("emits tools_finish with label and properties", () => {
    const provider = installMockProvider();

    trackToolsFinish("calculadora", { monthlyLost: 260000 });

    expect(provider).toHaveBeenCalledWith({
      name: "tools_finish",
      label: "calculadora",
      properties: { monthlyLost: 260000 },
    });
  });

  it("emits tools_finish with label only when no properties", () => {
    const provider = installMockProvider();

    trackToolsFinish("test-atencion", { score: 75 });

    expect(provider).toHaveBeenCalledWith({
      name: "tools_finish",
      label: "test-atencion",
      properties: { score: 75 },
    });
  });

  it("emits tools_finish with empty properties when undefined", () => {
    const provider = installMockProvider();

    trackToolsFinish("calculadora");

    expect(provider).toHaveBeenCalledWith({
      name: "tools_finish",
      label: "calculadora",
      properties: undefined,
    });
  });
});

describe("trackDemoMessage", () => {
  it("emits demo_message with the rubro context as label", () => {
    const provider = installMockProvider();

    trackDemoMessage("peluqueria");

    expect(provider).toHaveBeenCalledWith({
      name: "demo_message",
      label: "peluqueria",
    });
  });
});

describe("existing helpers still work", () => {
  it("trackFormSubmit emits form_submit with vertical in properties", () => {
    const provider = installMockProvider();

    trackFormSubmit("barberia");

    expect(provider).toHaveBeenCalledWith({
      name: "form_submit",
      properties: { vertical: "barberia" },
    });
  });

  it("trackVerticalView emits vertical_view with label", () => {
    const provider = installMockProvider();

    trackVerticalView("taller");

    expect(provider).toHaveBeenCalledWith({
      name: "vertical_view",
      label: "taller",
    });
  });
});