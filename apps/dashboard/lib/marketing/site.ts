/**
 * Site-level identity used by document metadata (D1) and the crawl files (D2).
 *
 * Section copy lives in ./copy.ts. This module owns *identity* — hostname, name,
 * description, keywords — so `metadata`, `sitemap.ts`, `robots.ts` and the JSON-LD
 * builders all agree on one canonical origin instead of hardcoding it four times.
 */

import { verticals } from "./verticals";

export const SITE_NAME = "AicoreLink";

/** Canonical production origin. Trailing slashes are stripped so joins stay predictable. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://aicorelink.aicorebots.com"
).replace(/\/+$/, "");

/** Page title. Kept under 60 characters so Google does not truncate it. */
export const SITE_TITLE = "Sitios web con IA para negocios locales | AicoreLink";

export const SITE_DESCRIPTION =
  "Creamos tu página web y le conectamos un asistente con IA que responde por WhatsApp, agenda citas y capta clientes 24/7. Planes desde $49 por mes.";

/** Open Graph locale. */
export const SITE_LOCALE = "es_AR";

/**
 * Search terms the landing genuinely answers. The vertical names come from
 * `verticals.ts` so adding a rubro keeps the metadata in sync automatically.
 */
export const SITE_KEYWORDS: string[] = [
  "página web con IA",
  "sitios web para negocios locales",
  "chat con IA para WhatsApp",
  "agenda de citas automática",
  "captación de clientes",
  "reseñas automáticas",
  "recepcionista de voz con IA",
  ...verticals.map((vertical) => vertical.singular),
];

/**
 * Turns a site-relative path into an absolute URL on the canonical origin.
 * Required by structured data and metadata, which reject relative URLs.
 */
export function absoluteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString();
}
