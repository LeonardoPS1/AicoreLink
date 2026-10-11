import { afterEach, describe, expect, it, vi } from "vitest";

import { copy } from "@/lib/marketing/copy";
import { verticals } from "@/lib/marketing/verticals";

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL_SITE_URL === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
  }

  vi.resetModules();
});

/** site.ts reads process.env at import time, so each case needs a fresh module. */
async function loadSite() {
  return import("@/lib/marketing/site");
}

describe("site identity", () => {
  it("keeps the title and description inside what search engines show", async () => {
    const { SITE_TITLE, SITE_DESCRIPTION } = await loadSite();

    // Google truncates around 60 / 160 characters.
    expect(SITE_TITLE.length).toBeLessThanOrEqual(60);
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(70);
  });

  it("defaults the canonical origin to the production subdomain", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const { SITE_URL } = await loadSite();

    expect(SITE_URL).toBe("https://aicorelink.aicorebots.com");
  });

  it("honours NEXT_PUBLIC_SITE_URL and strips trailing slashes", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://staging.example.com//";

    const { SITE_URL, absoluteUrl } = await loadSite();

    expect(SITE_URL).toBe("https://staging.example.com");
    expect(absoluteUrl("/")).toBe("https://staging.example.com/");
    expect(absoluteUrl("/#contacto")).toBe("https://staging.example.com/#contacto");
  });

  it("derives keywords from the verticals so a new rubro stays covered", async () => {
    const { SITE_KEYWORDS } = await loadSite();

    for (const vertical of verticals) {
      expect(SITE_KEYWORDS).toContain(vertical.singular);
    }

    expect(SITE_KEYWORDS).toContain("página web con IA");
    // No duplicates: the list is built by concatenating a literal block and a map.
    expect(new Set(SITE_KEYWORDS).size).toBe(SITE_KEYWORDS.length);
  });

  it("lists every vertical exactly once", async () => {
    const { SITE_KEYWORDS } = await loadSite();

    expect(verticals).toHaveLength(6);
    expect(SITE_KEYWORDS.filter((keyword) => keyword.includes("Taller"))).toEqual([
      "Taller mecánico",
    ]);
  });

  it("declares the Argentine Spanish locale used by the copy", async () => {
    const { SITE_LOCALE, SITE_NAME } = await loadSite();

    expect(SITE_LOCALE).toBe("es_AR");
    expect(SITE_NAME).toBe(copy.brand.name);
  });
});
