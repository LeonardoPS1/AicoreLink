import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/marketing/site";

/**
 * The marketing site is a single page, so the sitemap holds exactly one entry.
 * Sections like #planes or #rubros are in-page anchors, not separate URLs, and
 * must not be listed here.
 *
 * Every other route the app serves is either an API endpoint (see robots.ts)
 * or an authenticated dashboard screen that has nothing to offer search.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
