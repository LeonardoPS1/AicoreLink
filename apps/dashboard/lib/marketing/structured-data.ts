/**
 * JSON-LD (schema.org) builders for the landing page.
 * Plan: docs/superpowers/plans/2026-10-11-aicorelink-landing-plan.md (§9, task D1)
 *
 * Kept as pure functions returning plain objects: the page serialises them into a
 * single <script type="application/ld+json">, and tests assert the shape without a
 * browser. No fabricated data — no invented phone number, no invented ratings.
 */

import { copy, type FaqItem } from "./copy";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "./site";

export type JsonLdNode = Record<string, unknown>;

/** Stable node identifiers so the Service can point back at the Organization. */
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

const ORG_LOGO = absoluteUrl("/icon.svg");

/**
 * The agency itself. `sameAs` reuses the ecosystem links already published in the
 * footer instead of duplicating a link list.
 */
export function organizationSchema(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      url: ORG_LOGO,
    },
    sameAs: copy.footer.ecosystem.links.map((link) => link.href),
    areaServed: {
      "@type": "Country",
      name: "Chile",
    },
    // Points at the on-page conversion path (booking + WhatsApp) on purpose:
    // a ContactPoint with a placeholder phone number would publish a fake number.
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      url: absoluteUrl("/#contacto"),
      availableLanguage: ["es"],
    },
  };
}

/**
 * The product being sold: an AI-powered website plus its monthly maintenance,
 * expressed as one Offer per plan so Rich Results can list the tiering.
 *
 * Prices come from `plan.priceCLP` (numbers) and are quoted in CLP, VAT excluded.
 */
export function serviceSchema(): JsonLdNode {
  return {
    "@type": "Service",
    "@id": `${SITE_URL}/#service`,
    name: "Sitios web con IA para negocios locales",
    serviceType: "Diseño, hosting y mantenimiento de sitios web con asistentes de IA",
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    provider: { "@id": ORGANIZATION_ID },
    areaServed: {
      "@type": "Country",
      name: "Chile",
    },
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Negocios locales de servicios",
    },
    offers: copy.pricing.plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      description: plan.forWho,
      price: plan.priceCLP,
      priceCurrency: "CLP",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/#planes"),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: plan.priceCLP,
        priceCurrency: "CLP",
        billingDuration: "P1M",
        billingIncrement: 1,
      },
    })),
  };
}

/** FAQ markup mirroring the visible accordion, so Google can show the answers inline. */
export function faqPageSchema(items: FaqItem[] = copy.faq.items): JsonLdNode {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * Single `@graph` document for the whole page.
 *
 * One script instead of three keeps the <head> lean and lets the Service reference
 * the Organization by `@id`. FAQ markup is emitted only when the page actually
 * renders those questions (Google requires the markup to match visible content).
 */
export function landingStructuredData(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationSchema(), serviceSchema(), faqPageSchema()],
  };
}

/**
 * JSON-LD ready to be inlined in a <script> tag. `<` is escaped so no string in
 * the document can terminate the script element early.
 */
export function serializeStructuredData(
  data: JsonLdNode = landingStructuredData(),
): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
