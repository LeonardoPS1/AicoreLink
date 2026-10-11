import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroSection } from "@/components/marketing/hero-section";
import { TrustBar } from "@/components/marketing/trust-bar";
import { copy } from "@/lib/marketing/copy";

describe("HeroSection", () => {
  it("renders the full headline as the single h1", () => {
    render(<HeroSection />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.hero.headline);
  });

  it("points the primary CTA at the contact section and the secondary at how it works", () => {
    render(<HeroSection />);

    expect(screen.getByRole("link", { name: new RegExp(copy.hero.primaryCta, "i") })).toHaveAttribute(
      "href",
      "#contacto",
    );
    expect(screen.getByRole("link", { name: new RegExp(copy.hero.secondaryCta, "i") })).toHaveAttribute(
      "href",
      "#como-funciona",
    );
  });

  it("shows the eyebrow, subhead and trust line", () => {
    render(<HeroSection />);

    expect(screen.getByText(copy.hero.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(copy.hero.subhead)).toBeInTheDocument();
    expect(screen.getByText(copy.hero.trustLine)).toBeInTheDocument();
  });

  it("keeps the illustrative mockup out of the accessibility tree", () => {
    const { container } = render(<HeroSection />);

    expect(container.querySelector('div[aria-hidden="true"]')).not.toBeNull();
  });
});

describe("TrustBar", () => {
  it("renders the statement plus the four proof items", () => {
    render(<TrustBar />);

    expect(screen.getByText(copy.trustBar.statement)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(copy.trustBar.items.length);
  });
});
