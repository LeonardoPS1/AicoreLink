import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/marketing/site";

/**
 * Only the landing page should be crawled. Everything else needs a session and
 * would render as an empty shell to a crawler.
 *
 * The dashboard layouts also send `noindex` on purpose: a Disallow rule only
 * prevents crawling, not indexing of a URL Google discovers through a link or
 * a past crawl.
 *
 * Every private screen lives under `/dashboard` (the internal area included,
 * at `/dashboard/admin/*`), so that single prefix covers them all.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/dashboard"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
