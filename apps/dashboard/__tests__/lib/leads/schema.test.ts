import { describe, expect, it } from "vitest";
import { leadSchema, type LeadInput } from "@/lib/leads/schema";

const VALID_BASE: LeadInput = {
  nombre: "Juan Pérez",
  negocio: "Barbería El Corte",
  whatsapp: "+56 9 5555 5555",
  rubro: "barberia",
  mensaje: "Pierdo consultas por no contestar a tiempo.",
  utm: {
    source: "google",
    medium: "cpc",
    campaign: "verano_2026",
    content: "anuncio_1",
    term: "sitio web barberia",
  },
  consent: true,
};

describe("leadSchema", () => {
  it("parses a valid payload with full UTM and consent:true", () => {
    const result = leadSchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.utm).toEqual(VALID_BASE.utm);
      expect(result.data.consent).toBe(true);
    }
  });

  it("rejects when consent is missing", () => {
    const { consent, ...withoutConsent } = VALID_BASE;
    const result = leadSchema.safeParse(withoutConsent);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toHaveProperty("consent");
    }
  });

  it("rejects when consent is false (literal true required)", () => {
    const result = leadSchema.safeParse({ ...VALID_BASE, consent: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toHaveProperty("consent");
    }
  });

  it("rejects UTM fields exceeding 100 characters", () => {
    const longString = "a".repeat(101);
    const result = leadSchema.safeParse({
      ...VALID_BASE,
      utm: { source: longString, medium: "cpc", campaign: "test", content: "test", term: "test" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toHaveProperty("utm");
    }
  });

  it("accepts UTM as optional (undefined is valid)", () => {
    const { utm, ...withoutUtm } = VALID_BASE;
    const result = leadSchema.safeParse(withoutUtm);
    expect(result.success).toBe(true);
  });

  it("accepts partial UTM object", () => {
    const result = leadSchema.safeParse({
      ...VALID_BASE,
      utm: { source: "facebook" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.utm?.source).toBe("facebook");
      expect(result.data.utm?.medium).toBeUndefined();
    }
  });
});