import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { copy } from "@/lib/marketing/copy";

describe("TestimonialsSection", () => {
  it("renders the section title and subtitle from copy", () => {
    render(<TestimonialsSection />);

    expect(
      screen.getByRole("heading", { level: 2, name: copy.testimonials.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.testimonials.subtitle)).toBeInTheDocument();
  });

  it("renders three illustrative example cards", () => {
    render(<TestimonialsSection />);

    expect(screen.getAllByText("Ejemplo")).toHaveLength(3);
  });

  it("does not present placeholders as real client claims", () => {
    render(<TestimonialsSection />);

    expect(screen.getByText(copy.testimonials.placeholderNotice)).toBeInTheDocument();
  });

  it("attributes every example card to a business type, not a person", () => {
    const { container } = render(<TestimonialsSection />);

    const cards = container.querySelectorAll("[data-example='true']");
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.querySelector("blockquote")).toBeNull();
    }
  });
});
