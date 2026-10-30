export type HeroVariant = "A" | "B";

export interface HeroCopy {
  headline: string;
  subheadline: string;
  ctaText: string;
}

export const HERO_VARIANTS: Record<HeroVariant, HeroCopy> = {
  A: {
    headline: "Tu negocio atiende por WhatsApp, incluso cuando duermes",
    subheadline: "Sitio web con IA que responde, agenda y vende las 24 horas.",
    ctaText: "Quiero mi sitio",
  },
  B: {
    headline: "Deja de perder clientes por no responder a tiempo",
    subheadline: "AicoreLink crea tu sitio con IA que atiende por WhatsApp automáticamente.",
    ctaText: "Calcula cuánto pierdes",
  },
};

/**
 * Assigns a variant based on a seed (e.g., session ID or cookie value).
 * Returns "A" or "B" deterministically.
 */
export function assignVariant(seed: string): HeroVariant {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2 === 0 ? "A" : "B";
}

export function getHeroCopy(variant: HeroVariant): HeroCopy {
  return HERO_VARIANTS[variant];
}