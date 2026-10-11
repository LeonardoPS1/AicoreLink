import { describe, expect, it } from "vitest";

import { copy } from "@/lib/marketing/copy";
import {
  faqPageSchema,
  landingStructuredData,
  organizationSchema,
  serializeStructuredData,
  serviceSchema,
} from "@/lib/marketing/structured-data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/marketing/site";
import { verticals } from "@/lib/marketing/verticals";

type Node = Record<string, any>;

function graph(): Node[] {
  return landingStructuredData()["@graph"] as Node[];
}

function byType(type: string): Node {
  const node = graph().find((item) => item["@type"] === type);

  if (!node) {
    throw new Error(`No JSON-LD node of type ${type}`);
  }

  return node;
}

describe("landingStructuredData", () => {
  it("emits schema.org context with the three landing nodes", () => {
    const data = landingStructuredData();

    expect(data["@context"]).toBe("https://schema.org");
    expect(graph().map((node) => node["@type"])).toEqual([
      "Organization",
      "Service",
      "FAQPage",
    ]);
  });

  it("never publishes a phone number it does not have", () => {
    // The WhatsApp number is still a placeholder ("5491100000000"). Structured
    // data is public and indexed, so it must not carry invented contact data.
    const serialised = JSON.stringify(landingStructuredData());

    expect(serialised).not.toMatch(/telephone/);
    expect(serialised).not.toMatch(/5491100000000/);
  });
});

describe("organizationSchema", () => {
  it("identifies the agency on the canonical origin", () => {
    const org = organizationSchema() as Node;

    expect(org.name).toBe(SITE_NAME);
    expect(org.description).toBe(SITE_DESCRIPTION);
    expect(org.url).toBe(`${SITE_URL}/`);
    expect(org.logo.url).toBe(`${SITE_URL}/icon.svg`);
  });

  it("lists the published ecosystem sites and points contact at the landing", () => {
    const org = organizationSchema() as Node;

    expect(org.sameAs).toEqual(
      copy.footer.ecosystem.links.map((link) => link.href),
    );
    expect(org.contactPoint.url).toBe(`${SITE_URL}/#contacto`);
    expect(org.contactPoint.availableLanguage).toEqual(["es"]);
  });
});

describe("serviceSchema", () => {
  it("references the organization by @id instead of duplicating it", () => {
    const service = serviceSchema() as Node;
    const org = organizationSchema() as Node;

    expect(service.provider).toEqual({ "@id": org["@id"] });
  });

  it("exposes one priced offer per plan", () => {
    const service = serviceSchema() as Node;
    const offers = service.offers as Node[];

    expect(offers).toHaveLength(copy.pricing.plans.length);

    for (const [index, plan] of copy.pricing.plans.entries()) {
      const offer = offers[index];

      expect(offer.name).toBe(plan.name);
      expect(offer.price).toBe(plan.price.replace(/[^\d.]/g, ""));
      expect(Number(offer.price)).toBeGreaterThan(0);
      expect(offer.priceCurrency).toBe("USD");
      expect(offer.url).toBe(`${SITE_URL}/#planes`);
      expect(offer.priceSpecification.billingDuration).toBe("P1M");
    }
  });

  it("names the verticals it serves", () => {
    const service = serviceSchema() as Node;

    expect(service.audience.audienceType).toBe("Negocios locales de servicios");
    // Sanity check that verticals drive the keyword set, not a stale copy.
    expect(verticals.length).toBeGreaterThan(0);
  });
});

describe("faqPageSchema", () => {
  it("mirrors the rendered accordion one-to-one", () => {
    const faq = faqPageSchema() as Node;
    const questions = faq.mainEntity as Node[];

    expect(questions).toHaveLength(copy.faq.items.length);

    for (const [index, item] of copy.faq.items.entries()) {
      expect(questions[index]).toEqual({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      });
    }
  });

  it("accepts an explicit item list", () => {
    const faq = faqPageSchema([{ question: "¿Sí?", answer: "Sí." }]);

    expect(faq.mainEntity).toHaveLength(1);
  });
});

describe("serializeStructuredData", () => {
  it("escapes '<' so the payload cannot close the script tag", () => {
    const serialised = serializeStructuredData({
      "@type": "Thing",
      name: "</script><img src=x onerror=alert(1)>",
    });

    expect(serialised).not.toContain("</script");
    expect(serialised).toContain("\\u003c/script");
  });

  it("round-trips back to the same object", () => {
    const serialised = serializeStructuredData();

    expect(JSON.parse(serialised)).toEqual(landingStructuredData());
  });
});
