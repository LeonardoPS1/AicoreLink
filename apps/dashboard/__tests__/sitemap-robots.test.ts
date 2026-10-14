import { describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/marketing/site";

// The panel layouts pull in next-auth and lib/db (which throws without
// DATABASE_URL at import time), so they have to be stubbed just to read their
// exported metadata.
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const PROTECTED_PATHS = ["/api/", "/login", "/dashboard"];

describe("sitemap", () => {
  it("lists the landing page only", () => {
    const entries = sitemap();

    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe(`${SITE_URL}/`);
  });

  it("uses absolute URLs and never lists an in-page anchor", () => {
    for (const entry of sitemap()) {
      expect(entry.url).toMatch(/^https:\/\//);
      expect(entry.url).not.toContain("#");
    }
  });

  it("advertises freshness and priority for the single entry", () => {
    const [entry] = sitemap();

    expect(entry.lastModified).toBeInstanceOf(Date);
    expect(entry.changeFrequency).toBe("weekly");
    expect(entry.priority).toBe(1);
  });
});

describe("robots", () => {
  it("points crawlers at the sitemap on the canonical origin", () => {
    const parsed = robots();

    expect(parsed.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(parsed.host).toBe(SITE_URL);
  });

  it("allows the landing and blocks the private surface", () => {
    const parsed = robots();
    const rules = Array.isArray(parsed.rules) ? parsed.rules : [parsed.rules];
    const wildcard = rules.find((rule) => rule.userAgent === "*");

    expect(wildcard).toBeDefined();
    expect(wildcard!.allow).toBe("/");

    const disallow = Array.isArray(wildcard!.disallow)
      ? wildcard!.disallow
      : [wildcard!.disallow];

    for (const path of PROTECTED_PATHS) {
      expect(disallow).toContain(path);
    }
  });

  it("does not block the landing page itself", () => {
    const parsed = robots();
    const rules = Array.isArray(parsed.rules) ? parsed.rules : [parsed.rules];
    const disallow = rules.flatMap((rule) =>
      Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow],
    );

    expect(disallow).not.toContain("/");
  });
});

describe("panel layouts", () => {
  it("keep the admin panel out of search results", async () => {
    const { metadata } = await import("@/app/dashboard/admin/layout");

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("keep the client panel out of search results", async () => {
    const { metadata } = await import("@/app/dashboard/layout");

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
