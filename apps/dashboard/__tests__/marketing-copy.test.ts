import { describe, it, expect } from "vitest";
import {
  copy,
  formatCLP,
  whatsappUrl,
  presetWhatsappUrl,
  PRESET_MESSAGES,
  WHATSAPP_PHONE,
  bookingUrl,
} from "@/lib/marketing/copy";
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

  it("enumerates exactly 8 pain points with icon, title and description", () => {
    expect(copy.pains.items).toHaveLength(8);
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

  it("shows the services-only positioning (no catalog stores)", () => {
    expect(copy.verticals.note.toLowerCase()).toContain("catálogo");
  });
});

describe("v2 pricing (§23)", () => {
  it("offers four plans in ascending CLP price order", () => {
    expect(copy.pricing.plans.map((plan) => plan.id)).toEqual([
      "semilla",
      "starter",
      "growth",
      "elite",
    ]);
    expect(copy.pricing.plans.map((plan) => plan.priceCLP)).toEqual([
      0, 19990, 49990, 99990,
    ]);
  });

  it("quotes VAT separately on every paid plan", () => {
    for (const plan of copy.pricing.plans) {
      if (plan.id === "semilla") {
        expect(plan.priceNote).not.toContain("IVA");
      } else {
        expect(plan.priceNote).toContain("IVA");
      }
    }
  });

  it("marks exactly one best seller and one highlighted plan, both Growth", () => {
    const bestSellers = copy.pricing.plans.filter((plan) => plan.bestSeller);
    expect(bestSellers).toHaveLength(1);
    expect(bestSellers[0].id).toBe("growth");

    const highlighted = copy.pricing.plans.filter((plan) => plan.highlighted);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].id).toBe("growth");
  });

  it("gives every plan at least three features and a positioning tagline", () => {
    for (const plan of copy.pricing.plans) {
      expect(plan.features.length).toBeGreaterThanOrEqual(3);
      expect(plan.tagline).toBeTruthy();
    }
  });

  it("formats CLP amounts the Chilean way", () => {
    expect(formatCLP(19990)).toBe("$19.990");
    expect(formatCLP(99990)).toBe("$99.990");
  });
});

describe("v2 FAQ (§10.8)", () => {
  it("answers eight objections in the FAQ", () => {
    expect(copy.faq.items).toHaveLength(8);
    for (const item of copy.faq.items) {
      expect(item.question).toBeTruthy();
      expect(item.answer).toBeTruthy();
    }
  });
});

describe("voice and currency guardrails", () => {
  it("never uses Rioplatense voseo in copy or verticals", () => {
    const blob = JSON.stringify({ copy, verticals });
    expect(blob).not.toMatch(
      /\b(vos|sos|tenés|podés|querés|sabés|hacés|decís|venís|elegís|agendás|pagás|necesitás|trabajás|llegás|usás|andá|mirá|probá|fijate|contame|dejame|pedime|identificás|cerrás|manejás)\b/i,
    );
  });

  it("no longer carries the old USD prices", () => {
    expect(JSON.stringify(copy)).not.toMatch(/\$49\b|\$99\b|\$199\b/);
  });
});

describe("preset WhatsApp messages (§10.9)", () => {
  it("defines one preset per entry point", () => {
    for (const key of [
      "hero",
      "demo",
      "calculadora",
      "starter",
      "growth",
      "elite",
    ] as const) {
      expect(PRESET_MESSAGES[key]).toBeTruthy();
    }
  });

  it("builds a wa.me link and fills the rubro token", () => {
    const url = presetWhatsappUrl("hero", { rubro: "Barbería" });
    expect(url.startsWith("https://wa.me/")).toBe(true);
    expect(url).toContain(encodeURIComponent("mi negocio de Barbería"));
  });

  it("fills the estimated amount with CLP formatting", () => {
    const url = presetWhatsappUrl("calculadora", { amountCLP: 19990 });
    expect(url).toContain(encodeURIComponent("perdiendo $19.990 al mes"));
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
