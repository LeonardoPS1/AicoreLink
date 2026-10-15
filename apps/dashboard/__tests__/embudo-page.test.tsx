import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import EmbudoPage from "@/app/dashboard/admin/embudo/page";

describe("EmbudoPage", () => {
  it("renders the funnel dashboard with all 7 stages", () => {
    render(<EmbudoPage />);

    // Title and description
    expect(screen.getByRole("heading", { name: "Embudo de conversión" })).toBeInTheDocument();
    expect(screen.getByText("Visitas → CTA → Lead → Herramientas → Demo")).toBeInTheDocument();

    // 7 stage rows
    const stages = [
      "Visitas",
      "CTA clicks",
      "Form submits",
      "Tools start",
      "Tools finish",
      "Demo messages",
      "WhatsApp clicks",
    ];

    stages.forEach((stage) => {
      expect(screen.getByText(stage)).toBeInTheDocument();
    });
  });

  it("displays mock data for each stage", () => {
    render(<EmbudoPage />);

    // Check that numeric values are displayed (mock data) - es-CL uses . as thousands separator
    // Query within each card to avoid duplicates (e.g., 180 appears in Form submits and Demo messages)
    const visitasCard = screen.getByText("Visitas").closest(".rounded-xl") as HTMLElement;
    expect(within(visitasCard).getByText("12.500")).toBeInTheDocument();

    const ctaCard = screen.getByText("CTA clicks").closest(".rounded-xl") as HTMLElement;
    expect(within(ctaCard).getByText("3.200")).toBeInTheDocument();

    const formCard = screen.getByText("Form submits").closest(".rounded-xl") as HTMLElement;
    expect(within(formCard).getByText("480")).toBeInTheDocument();

    const toolsStartCard = screen.getByText("Tools start").closest(".rounded-xl") as HTMLElement;
    expect(within(toolsStartCard).getByText("650")).toBeInTheDocument();

    const toolsFinishCard = screen.getByText("Tools finish").closest(".rounded-xl") as HTMLElement;
    expect(within(toolsFinishCard).getByText("420")).toBeInTheDocument();

    const demoCard = screen.getByText("Demo messages").closest(".rounded-xl") as HTMLElement;
    expect(within(demoCard).getByText("180")).toBeInTheDocument();

    const whatsappCard = screen.getByText("WhatsApp clicks").closest(".rounded-xl") as HTMLElement;
    expect(within(whatsappCard).getByText("2.100")).toBeInTheDocument();
  });

  it("breaks down CTA clicks by label", () => {
    render(<EmbudoPage />);

    // Find the CTA clicks card and check its breakdown
    const ctaCard = screen.getByText("CTA clicks").closest(".rounded-xl") as HTMLElement;
    expect(within(ctaCard).getByText("hero")).toBeInTheDocument();
    expect(within(ctaCard).getByText("planes-growth")).toBeInTheDocument();
    expect(within(ctaCard).getByText("header")).toBeInTheDocument();
  });

  it("breaks down Form submits by vertical", () => {
    render(<EmbudoPage />);

    const formCard = screen.getByText("Form submits").closest(".rounded-xl") as HTMLElement;
    expect(within(formCard).getByText("barberia")).toBeInTheDocument();
    expect(within(formCard).getByText("taller")).toBeInTheDocument();
    expect(within(formCard).getByText("estudio")).toBeInTheDocument();
  });

  it("breaks down Tools start by tool label", () => {
    render(<EmbudoPage />);

    const toolsStartCard = screen.getByText("Tools start").closest(".rounded-xl") as HTMLElement;
    expect(within(toolsStartCard).getByText("calculadora")).toBeInTheDocument();
    expect(within(toolsStartCard).getByText("test-atencion")).toBeInTheDocument();
  });

  it("breaks down Tools finish with properties", () => {
    render(<EmbudoPage />);

    const toolsFinishCard = screen.getByText("Tools finish").closest(".rounded-xl") as HTMLElement;
    expect(within(toolsFinishCard).getByText("calculadora")).toBeInTheDocument();
    expect(within(toolsFinishCard).getByText("test-atencion")).toBeInTheDocument();
    // monthlyLost and score properties (rendered as badges with full labels)
    expect(within(toolsFinishCard).getByText("monthlyLost: 260.000")).toBeInTheDocument();
    expect(within(toolsFinishCard).getByText("score: 75")).toBeInTheDocument();
  });

  it("breaks down Demo messages by rubro", () => {
    render(<EmbudoPage />);

    const demoCard = screen.getByText("Demo messages").closest(".rounded-xl") as HTMLElement;
    expect(within(demoCard).getByText("peluqueria")).toBeInTheDocument();
    expect(within(demoCard).getByText("taller")).toBeInTheDocument();
    expect(within(demoCard).getByText("estudio")).toBeInTheDocument();
  });

  it("breaks down WhatsApp clicks by context", () => {
    render(<EmbudoPage />);

    const whatsappCard = screen.getByText("WhatsApp clicks").closest(".rounded-xl") as HTMLElement;
    expect(within(whatsappCard).getByText("sticky")).toBeInTheDocument();
    expect(within(whatsappCard).getByText("calculadora")).toBeInTheDocument();
    expect(within(whatsappCard).getByText("test")).toBeInTheDocument();
    expect(within(whatsappCard).getByText("demo")).toBeInTheDocument();
    expect(within(whatsappCard).getByText("contacto")).toBeInTheDocument();
  });
});