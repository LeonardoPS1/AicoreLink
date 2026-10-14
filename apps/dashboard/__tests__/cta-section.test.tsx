import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CtaSection } from "@/components/marketing/cta-section";
import { bookingUrl, copy, whatsappUrl, WHATSAPP_PHONE } from "@/lib/marketing/copy";

describe("CtaSection", () => {
  it("renders the #contacto anchor every CTA points at", () => {
    const { container } = render(<CtaSection />);

    expect(container.querySelector("section#contacto")).not.toBeNull();
  });

  it("renders the title and subtitle as the closing pitch", () => {
    render(<CtaSection />);

    expect(
      screen.getByRole("heading", { level: 2, name: copy.cta.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.cta.subtitle)).toBeInTheDocument();
  });

  it("links the primary CTA to the booking page", () => {
    render(<CtaSection />);

    expect(
      screen.getByRole("link", { name: new RegExp(copy.cta.primaryLabel) }),
    ).toHaveAttribute("href", bookingUrl);
  });

  it("links the secondary CTA to a prefilled WhatsApp conversation", () => {
    render(<CtaSection />);

    const link = screen.getByRole("link", {
      name: new RegExp(copy.cta.secondaryLabel),
    });

    expect(link).toHaveAttribute("href", whatsappUrl(copy.stickyWhatsApp.message));
    expect(link.getAttribute("href")).toContain(WHATSAPP_PHONE);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows the guarantee to reduce perceived risk", () => {
    render(<CtaSection />);

    expect(screen.getByText(copy.cta.guarantee)).toBeInTheDocument();
  });

  it("embeds the lead form next to the pitch", async () => {
    render(<CtaSection />);

    // The form mounts lazily (dynamic import off the critical path).
    expect(
      await screen.findByRole("button", { name: /Solicitar diagnóstico gratis/ }),
    ).toBeInTheDocument();
  });

  it("lists the three next steps", () => {
    render(<CtaSection />);
    copy.cta.steps.forEach((step) => expect(screen.getByText(step.label)).toBeInTheDocument());
  });
});
