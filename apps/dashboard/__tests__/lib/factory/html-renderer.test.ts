import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  renderBlockToHtml,
  renderBlocksToHtml,
} from "@/lib/factory/html-renderer";

describe("html-renderer", () => {
  it("escapes HTML special characters", () => {
    const input = `<b>a&b"c'd</b>`;
    expect(escapeHtml(input)).toBe(
      "&lt;b&gt;a&amp;b&quot;c&#039;d&lt;/b&gt;"
    );
  });

  it("returns empty string for null/undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("renders the hero block", () => {
    const html = renderBlockToHtml({
      type: "hero",
      content: { headline: "Hola", subheadline: "Sub", ctaPrimary: "Reservar" },
    });
    expect(html).toContain("Hola");
    expect(html).toContain("Sub");
    expect(html).toContain("Reservar");
  });

  it("renders services with a CLP price", () => {
    const html = renderBlockToHtml({
      type: "services",
      content: { items: [{ name: "Corte", priceCLP: 12000, durationMin: 30 }] },
    });
    expect(html).toContain("Corte");
    expect(html).toContain("12.000");
    expect(html).toContain("CLP + IVA");
  });

  it("renders contact hours and tel link", () => {
    const html = renderBlockToHtml({
      type: "contact",
      content: {
        phone: "+56911112222",
        hours: { lunes: { open: "09:00", close: "18:00" }, domingo: { closed: true } },
      },
    });
    expect(html).toContain("tel:+56911112222");
    expect(html).toContain("lunes: 09:00 - 18:00");
    expect(html).toContain("domingo: Cerrado");
  });

  it("escapes user content to prevent XSS", () => {
    const html = renderBlockToHtml({
      type: "hero",
      content: { headline: "<img src=x onerror=alert(1)>" },
    });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });

  it("returns an empty string for unknown block types", () => {
    expect(renderBlockToHtml({ type: "nope", content: {} })).toBe("");
    expect(renderBlockToHtml(null)).toBe("");
  });

  it("renders a list of blocks and skips unknown ones", () => {
    const html = renderBlocksToHtml([
      { type: "cta", content: {} },
      { type: "nope", content: {} },
    ]);
    expect(html).toContain("¿Listo para empezar?");
  });
});
