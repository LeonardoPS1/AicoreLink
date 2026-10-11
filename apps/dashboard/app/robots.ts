import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/marketing/site";

/**
 * Only the landing page should be crawled. Everything else needs a session and
 * would render as an empty shell to a crawler.
 *
 * The (admin) and (cliente) layouts also send `noindex` on purpose: a Disallow
 * rule only prevents crawling, not indexing of a URL Google discovers through
 * a link or a past crawl.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/login",
          "/dashboard",
          "/whatsapp",
          "/tenants",
          "/metricas",
          "/infraestructura",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
