import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const ORIGINAL_WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
const TEST_PHONE = "+56912345678";

afterEach(() => {
  if (ORIGINAL_WHATSAPP_PHONE === undefined) {
    delete process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
  } else {
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE = ORIGINAL_WHATSAPP_PHONE;
  }
  vi.resetModules();
});

/**
 * Integration test for the marketing layout footer and sticky WhatsApp.
 *
 * The MarketingLayout includes SiteFooter and StickyWhatsApp globally.
 * This test mocks NEXT_PUBLIC_WHATSAPP_PHONE and verifies:
 * - Footer renders 4 columns (Brand, Ecosystem, Contact, Legal) with correct links
 * - Both footer WhatsApp link and sticky WhatsApp use wa.me/<TEST_PHONE>
 * - Shared message from copy.stickyWhatsApp.message is used for both
 */
describe("MarketingLayout footer + sticky WhatsApp integration", () => {
  async function loadModules() {
    // Fresh imports after env mock so copy.ts picks up the mocked value
    const [{ SiteFooter }, { StickyWhatsApp }, { copy }, { whatsappUrl }] =
      await Promise.all([
        import("@/components/marketing/site-footer"),
        import("@/components/marketing/sticky-whatsapp"),
        import("@/lib/marketing/copy"),
        import("@/lib/marketing/copy").then((m) => ({ whatsappUrl: m.whatsappUrl })),
      ]);
    return { SiteFooter, StickyWhatsApp, copy, whatsappUrl };
  }

  it("renders footer with 4 columns and correct links", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE = TEST_PHONE;
    const { SiteFooter, copy, whatsappUrl } = await loadModules();

    const { container } = render(<SiteFooter />);

    // Brand column (col-span-2) - tagline present
    expect(container.querySelector(`[id="${copy.brand.name}"]`)).toBeNull(); // no id, just text
    expect(screen.getByText(copy.footer.tagline)).toBeInTheDocument();
    expect(screen.getByText(copy.brand.name)).toBeInTheDocument();

    // Ecosystem column
    expect(screen.getByText(copy.footer.ecosystem.title)).toBeInTheDocument();
    for (const link of copy.footer.ecosystem.links) {
      const anchor = screen.getByRole("link", { name: link.label });
      expect(anchor.getAttribute("href")).toBe(link.href);
      expect(anchor.getAttribute("target")).toBe("_blank");
      expect(anchor.getAttribute("rel")).toBe("noopener noreferrer");
    }

    // Contact column
    expect(screen.getByText(copy.footer.contact.title)).toBeInTheDocument();
    // WhatsApp link uses whatsappUrl with shared message
    const footerWhatsAppLink = screen.getByRole("link", {
      name: copy.footer.contact.links[0].label,
    });
    const expectedWhatsAppHref = whatsappUrl(copy.stickyWhatsApp.message, TEST_PHONE);
    expect(footerWhatsAppLink.getAttribute("href")).toBe(expectedWhatsAppHref);
    expect(footerWhatsAppLink.getAttribute("data-label")).toBe("footer");
    expect(footerWhatsAppLink.getAttribute("target")).toBe("_blank");
    expect(footerWhatsAppLink.getAttribute("rel")).toBe("noopener noreferrer");
    // Second contact link points to #contacto
    const bookingLink = screen.getByRole("link", {
      name: copy.footer.contact.links[1].label,
    });
    expect(bookingLink.getAttribute("href")).toBe("#contacto");

    // Legal column
    expect(screen.getByText("Legal")).toBeInTheDocument();
    for (const link of copy.footer.legalLinks) {
      const anchor = screen.getByRole("link", { name: link.label });
      expect(anchor.getAttribute("href")).toBe(link.href);
    }

    // Copyright line
    expect(screen.getByText(copy.footer.legal)).toBeInTheDocument();
  });

  it("sticky WhatsApp uses the same wa.me number and shared message", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE = TEST_PHONE;
    const { StickyWhatsApp, copy, whatsappUrl } = await loadModules();

    const { container } = render(<StickyWhatsApp />);

    const link = container.querySelector('a[data-label="sticky"]') as HTMLAnchorElement;
    const expectedWhatsAppHref = whatsappUrl(copy.stickyWhatsApp.message, TEST_PHONE);
    expect(link.getAttribute("href")).toBe(expectedWhatsAppHref);
    expect(link.getAttribute("data-label")).toBe("sticky");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link).toHaveTextContent(copy.stickyWhatsApp.label);
  });

  it("footer and sticky share the exact same WhatsApp message", async () => {
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE = TEST_PHONE;
    const { SiteFooter, StickyWhatsApp, copy, whatsappUrl } = await loadModules();

    const { container: footerContainer } = render(<SiteFooter />);
    const footerWhatsAppLink = footerContainer.querySelector(
      'a[data-label="footer"]',
    ) as HTMLAnchorElement;

    const { container: stickyContainer } = render(<StickyWhatsApp />);
    const stickyLink = stickyContainer.querySelector(
      'a[data-label="sticky"]',
    ) as HTMLAnchorElement;

    // Both should have identical href (same phone + same message)
    expect(footerWhatsAppLink.href).toBe(stickyLink.href);
    expect(footerWhatsAppLink.href).toBe(
      whatsappUrl(copy.stickyWhatsApp.message, TEST_PHONE),
    );
  });

  it("falls back to placeholder when NEXT_PUBLIC_WHATSAPP_PHONE is not set", async () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
    const { SiteFooter, StickyWhatsApp, copy, whatsappUrl } = await loadModules();

    const { container: footerContainer } = render(<SiteFooter />);
    const footerWhatsAppLink = footerContainer.querySelector(
      'a[data-label="footer"]',
    ) as HTMLAnchorElement;
    expect(footerWhatsAppLink.getAttribute("href")).toBe(
      whatsappUrl(copy.stickyWhatsApp.message),
    );

    const { container: stickyContainer } = render(<StickyWhatsApp />);
    const stickyLink = stickyContainer.querySelector(
      'a[data-label="sticky"]',
    ) as HTMLAnchorElement;
    expect(stickyLink.getAttribute("href")).toBe(
      whatsappUrl(copy.stickyWhatsApp.message),
    );
  });
});