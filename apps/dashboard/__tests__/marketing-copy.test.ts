import { describe, it, expect } from "vitest";
import { copy, whatsappUrl, WHATSAPP_PHONE, bookingUrl } from "@/lib/marketing/copy";
import { verticals } from "@/lib/marketing/verticals";

describe("landing copy (plan §6)", () => {
  it("has brand, nav and header CTA", () => {
    expect(copy.brand.name).toBe("AicoreLink");
    expect(copy.nav.length).toBeGreaterThanOrEqual(4);
    expect(copy.header.ctaLabel).toBeTruthy();
  });

  it("hero carries eyebrow, headline, subhead and double CTA", () => {
    expect(copy.hero.eyebrow).toBeTruthy();
    expect(copy.hero.headline).toBeTruthy();
    expect(copy.hero.subhead).toBeTruthy();
    expect(copy.hero.primaryCta).toBeTruthy();
    expect(copy.hero.secondaryCta).toBeTruthy();
    expect(copy.hero.trustLine).toBeTruthy();
  });

  it("enumerates exactly 5 pain points with icon, title and description", () => {
    expect(copy.pains.items).toHaveLength(5);
    for (const pain of copy.pains.items) {
      expect(pain.icon).toBeTruthy();
      expect(pain.title).toBeTruthy();
      expect(pain.description).toBeTruthy();
    }
    expect(copy.pains.closing).toBeTruthy();
  });

  it("describes the solution in three pillars: Atrae, Convierte, Atiende", () => {
    expect(copy.solution.columns).toHaveLength(3);
    expect(copy.solution.columns.map((column) => column.title)).toEqual([
      "Atrae",
      "Convierte",
      "Atiende",
    ]);
  });

  it("lists four how-it-works steps", () => {
    expect(copy.howItWorks.steps).toHaveLength(4);
  });

  it("offers three plans with Growth highlighted", () => {
    expect(copy.pricing.plans.map((plan) => plan.id)).toEqual(["starter", "growth", "elite"]);
    const highlighted = copy.pricing.plans.filter((plan) => plan.highlighted);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].id).toBe("growth");
    for (const plan of copy.pricing.plans) {
      expect(plan.features.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("answers seven objections in the FAQ", () => {
    expect(copy.faq.items).toHaveLength(7);
  });

  it("states the services-only positioning (no catalog stores)", () => {
    expect(copy.verticals.note.toLowerCase()).toContain("catálogo");
  });
});

describe("verticals (plan §2 / §6.7)", () => {
  it("exposes six tabs with pain, anchor and contextual CTA", () => {
    expect(verticals).toHaveLength(6);
    for (const vertical of verticals) {
      expect(vertical.id).toBeTruthy();
      expect(vertical.tab).toBeTruthy();
      expect(vertical.pain).toBeTruthy();
      expect(vertical.anchor).toBeTruthy();
      expect(vertical.solution).toBeTruthy();
      expect(vertical.ctaLabel).toContain(vertical.singular);
    }
  });

  it("uses unique ids", () => {
    const ids = verticals.map((vertical) => vertical.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("conversion links", () => {
  it("builds a wa.me url with an encoded prefilled message", () => {
    const url = whatsappUrl("Hola, quiero un sitio web con IA para mi negocio.", "5491122334455");
    expect(url.startsWith("https://wa.me/5491122334455?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("Hola, quiero un sitio web con IA"));
  });

  it("exposes a default whatsapp phone and booking url", () => {
    expect(WHATSAPP_PHONE).toBeTruthy();
    expect(bookingUrl).toBeTruthy();
  });
});
