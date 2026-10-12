import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PricingSection } from "@/components/marketing/pricing-section";
import { copy, formatCLP } from "@/lib/marketing/copy";

describe("PricingSection", () => {
  it("renders the section title and subtitle from copy", () => {
    render(<PricingSection />);

    expect(
      screen.getByRole("heading", { level: 2, name: copy.pricing.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.pricing.subtitle)).toBeInTheDocument();
  });

  it("exposes the #planes anchor target", () => {
    const { container } = render(<PricingSection />);

    expect(container.querySelector("section#planes")).not.toBeNull();
  });

  it("renders every plan name, CLP price and audience", () => {
    render(<PricingSection />);

    for (const plan of copy.pricing.plans) {
      expect(screen.getByText(plan.name)).toBeInTheDocument();
      expect(screen.getByText(formatCLP(plan.priceCLP))).toBeInTheDocument();
      expect(screen.getByText(plan.forWho)).toBeInTheDocument();
    }
  });

  it("shows the VAT note on paid plans and 'sin costo' on Semilla", () => {
    render(<PricingSection />);

    expect(screen.getAllByText("+ IVA")).toHaveLength(3);
    expect(screen.getByText("sin costo")).toBeInTheDocument();
  });

  it("renders the feature list of each plan", () => {
    render(<PricingSection />);

    for (const plan of copy.pricing.plans) {
      for (const feature of plan.features) {
        expect(screen.getAllByText(feature).length).toBeGreaterThan(0);
      }
    }
  });

  it("marks exactly one plan as highlighted, and it is the growth plan", () => {
    const { container } = render(<PricingSection />);

    const highlighted = copy.pricing.plans.filter((plan) => plan.highlighted);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].id).toBe("growth");

    const badges = container.querySelectorAll("[data-highlighted='true']");
    expect(badges).toHaveLength(1);
    expect(badges[0].getAttribute("data-plan")).toBe("growth");
  });

  it("renders each plan badge independent of the highlighted flag", () => {
    render(<PricingSection />);

    // Growth is highlighted ("Más elegido"); Elite is not highlighted but still badged.
    expect(screen.getByText("Más elegido")).toBeInTheDocument();
    expect(screen.getByText("Atención completa")).toBeInTheDocument();
  });

  it("points every plan CTA at the contact section", () => {
    render(<PricingSection />);

    const ctas = screen.getAllByRole("link", { name: copy.pricing.plans[0].ctaLabel });
    expect(ctas).toHaveLength(copy.pricing.plans.length);
    for (const cta of ctas) {
      expect(cta).toHaveAttribute("href", "#contacto");
    }
  });

  it("renders the pricing note", () => {
    render(<PricingSection />);

    expect(screen.getByText(copy.pricing.note)).toBeInTheDocument();
  });
});
