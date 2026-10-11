import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { StickyWhatsApp } from "@/components/marketing/sticky-whatsapp";
import { copy } from "@/lib/marketing/copy";

describe("SiteHeader", () => {
  it("renders the brand, every nav anchor and the header CTA", () => {
    render(<SiteHeader />);

    expect(screen.getByText(copy.brand.name)).toBeDefined();
    for (const item of copy.nav) {
      expect(screen.getAllByText(item.label).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText(copy.header.ctaLabel).length).toBeGreaterThan(0);
  });

  it("exposes an accessible mobile menu toggle", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeDefined();
  });
});

describe("SiteFooter", () => {
  it("links out to every product in the ecosystem", () => {
    render(<SiteFooter />);

    for (const link of copy.footer.ecosystem.links) {
      const anchor = screen.getByRole("link", { name: link.label });
      expect(anchor.getAttribute("href")).toBe(link.href);
    }
  });
});

describe("StickyWhatsApp", () => {
  it("points at a wa.me link with the prefilled message", () => {
    render(<StickyWhatsApp />);

    const link = screen.getByRole("link");
    const href = link.getAttribute("href") ?? "";
    expect(href.startsWith("https://wa.me/")).toBe(true);
    expect(href).toContain(encodeURIComponent(copy.stickyWhatsApp.message));
  });
});
