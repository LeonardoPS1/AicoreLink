import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { AnalyticsTracker } from "@/components/marketing/analytics-tracker";
import { setAnalyticsProvider, type AnalyticsEvent } from "@/lib/analytics";

function installMockProvider() {
  const provider = vi.fn<(event: AnalyticsEvent) => void>();
  setAnalyticsProvider(provider);
  return provider;
}

afterEach(() => {
  setAnalyticsProvider(null);
  vi.restoreAllMocks();
});

describe("AnalyticsTracker", () => {
  it("reports WhatsApp links, labelling them from the section id", () => {
    const provider = installMockProvider();

    render(
      <section id="contacto">
        <AnalyticsTracker />
        <a href="https://wa.me/5491100000000?text=Hola">Escribinos</a>
      </section>,
    );

    fireEvent.click(screen.getByText("Escribinos"));

    expect(provider).toHaveBeenCalledWith({ name: "whatsapp_click", label: "contacto" });
  });

  it("prefers an explicit data-label over the section id", () => {
    const provider = installMockProvider();

    render(
      <div>
        <AnalyticsTracker />
        <a href="https://wa.me/5491100000000" data-label="sticky">
          WhatsApp
        </a>
      </div>,
    );

    fireEvent.click(screen.getByText("WhatsApp"));

    expect(provider).toHaveBeenCalledWith({ name: "whatsapp_click", label: "sticky" });
  });

  it("reports data-track elements with their label", () => {
    const provider = installMockProvider();

    render(
      <section id="inicio">
        <AnalyticsTracker />
        <a href="#contacto" data-track="cta_click" data-label="hero">
          Quiero mi web
        </a>
      </section>,
    );

    fireEvent.click(screen.getByText("Quiero mi web"));

    expect(provider).toHaveBeenCalledWith({ name: "cta_click", label: "hero" });
  });

  it("falls back to the section id when data-label is missing", () => {
    const provider = installMockProvider();

    render(
      <section id="planes">
        <AnalyticsTracker />
        <a href="#contacto" data-track="cta_click">
          Empezar
        </a>
      </section>,
    );

    fireEvent.click(screen.getByText("Empezar"));

    expect(provider).toHaveBeenCalledWith({ name: "cta_click", label: "planes" });
  });

  it("ignores clicks on untracked elements", () => {
    const provider = installMockProvider();

    render(
      <div>
        <AnalyticsTracker />
        <button type="button">Normal</button>
      </div>,
    );

    fireEvent.click(screen.getByText("Normal"));

    expect(provider).not.toHaveBeenCalled();
  });
});