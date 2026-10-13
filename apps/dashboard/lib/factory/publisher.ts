/**
 * Site Publisher for the Fábrica de sitios (site factory).
 *
 * Deploys an approved site version as static files and wires Traefik routing
 * for either a managed subdomain or a customer's custom domain, obtaining TLS
 * certificates automatically via Let's Encrypt (Traefik ACME resolver).
 *
 * All tenant data access goes through withTenant() so Postgres RLS applies.
 */

import { withTenant } from "@/lib/tenant-context";
import { renderBlocksToHtml, escapeHtml } from "./html-renderer";
import * as fs from "fs/promises";
import * as path from "path";
import { execSync } from "child_process";
import { resolveCname } from "dns/promises";

export const STATIC_SITES_ROOT = "/var/www/sites";
export const TRAEFIK_DYNAMIC_DIR = "/etc/traefik/dynamic";
export const TRAEFIK_ACME_DIR = "/etc/traefik/acme/certs";
export const SUBDOMAIN_SUFFIX = "aicorelink.aicorebots.com";
export const CNAME_TARGET = "sites.aicorelink.aicorebots.com";
export const STATIC_FILES_PORT = Number(process.env.STATIC_SITES_PORT || 3001);

export type PublishTarget = "subdomain" | "custom";

export interface PublishSiteInput {
  siteId: string;
  version: number;
  target: PublishTarget;
  customDomain?: string;
  tenantId: string;
}

export interface PublishResult {
  success: boolean;
  domain: string;
  message: string;
}

export interface DnsVerificationResult {
  valid: boolean;
  cnameTarget?: string;
}

export interface TlsResult {
  success: boolean;
  certPath?: string;
}

/**
 * Tunable timings for the deploy steps. Defaults are production values;
 * callers (mainly tests) can shorten them.
 */
export interface PublishOptions {
  tlsTimeoutMs?: number;
  tlsIntervalMs?: number;
  healthRetries?: number;
  healthIntervalMs?: number;
  resolveCname?: (domain: string) => Promise<string[]>;
}

interface PageSnapshot {
  path: string;
  title?: string;
  content?: { blocks?: unknown[] };
  meta?: Record<string, any>;
  order?: number;
}

/**
 * Domain-level error carrying an HTTP status so API routes can map failures
 * (e.g. concurrent publish -> 409) without string matching.
 */
export class PublishError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode = 400) {
    super(message);
    this.name = "PublishError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function traefikConfigPath(tenantId: string, siteId: string): string {
  return path.join(TRAEFIK_DYNAMIC_DIR, `sites-${tenantId}-${siteId}.yml`);
}

function reloadTraefik(): void {
  try {
    execSync("docker kill --signal=HUP traefik", { stdio: "ignore" });
    return;
  } catch {
    // Container name may differ; fall back to the CLI reload.
  }
  try {
    execSync("traefik reload", { stdio: "ignore" });
  } catch {
    // Reload is best-effort: Traefik also watches the dynamic config directory.
  }
}

/**
 * Resolves the CNAME record for a domain and checks it points at our edge.
 *
 * @param resolver DNS resolver, injectable for testing (defaults to dns/promises).
 */
export async function verifyDns(
  domain: string,
  resolver: (domain: string) => Promise<string[]> = resolveCname
): Promise<DnsVerificationResult> {
  try {
    const records = (await resolver(domain).catch(() => [] as string[])) || [];
    const cnameTarget = records.find(
      (record) =>
        typeof record === "string" &&
        record.replace(/\.$/, "").toLowerCase() === CNAME_TARGET
    );
    return cnameTarget ? { valid: true, cnameTarget } : { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * Waits for Traefik to provision an ACME certificate for the domain.
 *
 * @param timeoutMs total time to wait (default 60s). Pass 0 to check once.
 */
export async function requestTls(
  domain: string,
  timeoutMs = 60000,
  intervalMs = 2000
): Promise<TlsResult> {
  const certPath = path.join(TRAEFIK_ACME_DIR, `${domain}.crt`);
  const deadline = Date.now() + timeoutMs;

  do {
    try {
      await fs.access(certPath);
      return { success: true, certPath };
    } catch {
      // Certificate not yet present; retry until deadline.
    }
    if (Date.now() >= deadline) break;
    await sleep(intervalMs);
  } while (Date.now() < deadline);

  return { success: false };
}

/**
 * Builds a Traefik dynamic configuration file for a site.
 */
export function generateTraefikConfig(input: {
  tenantId: string;
  siteId: string;
  domain: string;
  isCustomDomain: boolean;
  sanDomains?: string[];
  staticFilesPort?: number;
}): string {
  const {
    tenantId,
    siteId,
    domain,
    isCustomDomain,
    sanDomains = [],
    staticFilesPort = STATIC_FILES_PORT,
  } = input;
  const name = `site-${tenantId}-${siteId}`;
  const tls = isCustomDomain
    ? `      tls:
        certResolver: letsencrypt
        domains:
          - main: "${domain}"
            sans:
${sanDomains.map((san) => `              - "${san}"`).join("\n")}`
    : `      tls:
        certResolver: letsencrypt`;

  return `# Managed by AicoreLink (Fábrica de sitios) — do not edit manually.
http:
  routers:
    ${name}:
      rule: "Host(\`${domain}\`)"
      service: ${name}
${tls}
  services:
    ${name}:
      loadBalancer:
        servers:
          - url: "http://localhost:${staticFilesPort}/sites/${tenantId}/${siteId}"
`;
}

export async function writeTraefikConfigAndReload(
  tenantId: string,
  siteId: string,
  config: string
): Promise<void> {
  await fs.mkdir(TRAEFIK_DYNAMIC_DIR, { recursive: true });
  await fs.writeFile(traefikConfigPath(tenantId, siteId), config, "utf8");
  reloadTraefik();
}

export async function removeTraefikConfigAndReload(
  tenantId: string,
  siteId: string
): Promise<void> {
  try {
    await fs.unlink(traefikConfigPath(tenantId, siteId));
  } catch {
    // File may already be gone; treat as success.
  }
  reloadTraefik();
}

/**
 * Renders a single page snapshot to a full HTML document.
 */
export function generatePageHtml(page: PageSnapshot, host = ""): string {
  const meta = page.meta || {};
  const blocks = page.content?.blocks || [];
  const title = escapeHtml(meta.title || page.title || "");
  const description = meta.description ? escapeHtml(meta.description) : "";
  const ogImage = meta.ogImage
    ? `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`
    : "";
  const robots = meta.noindex ? `<meta name="robots" content="noindex, nofollow" />` : "";
  const pagePath = page.path || "/";
  const canonical =
    host && pagePath !== "*"
      ? `<link rel="canonical" href="${escapeHtml(`https://${host}${pagePath === "/" ? "" : pagePath}`)}" />`
      : "";

  return `<!DOCTYPE html>
<html lang="es-CL">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  ${description ? `<meta name="description" content="${description}" />` : ""}
  <meta property="og:title" content="${title}" />
  ${description ? `<meta property="og:description" content="${description}" />` : ""}
  ${canonical}
  ${ogImage}
  ${robots}
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            navy: "#0F172A",
            brand: { DEFAULT: "#2563EB", dark: "#1D4ED8" },
            teal: { DEFAULT: "#0D9488", dark: "#0F766E", light: "#5EEAD4" }
          }
        }
      }
    };
  </script>
</head>
<body class="antialiased text-slate-800">
${renderBlocksToHtml(blocks)}
<footer class="py-8 text-center text-sm text-slate-500 border-t border-slate-200">
  Sitio generado por AicoreLink
</footer>
</body>
</html>`;
}

/**
 * Writes the static export of a site version to disk.
 *
 * `index.html` is used for the root page; other pages map to `{path}.html`.
 * A `health` marker (body `OK`) is written so probes can check availability.
 */
export async function deployStaticFiles(
  tenantId: string,
  siteId: string,
  pages: PageSnapshot[],
  host = ""
): Promise<string> {
  const dir = path.join(STATIC_SITES_ROOT, tenantId, siteId);
  await fs.mkdir(dir, { recursive: true });

  for (const page of pages) {
    const html = generatePageHtml(page, host);
    const rel =
      !page.path || page.path === "/"
        ? "index.html"
        : `${page.path.replace(/^\//, "").replace(/\/$/, "")}.html`;
    await fs.writeFile(path.join(dir, rel), html, "utf8");
  }

  await fs.writeFile(path.join(dir, "health"), "OK", "utf8");
  return dir;
}

/**
 * Polls `https://{domain}/health` until it returns 200 with body `OK`.
 */
export async function healthCheck(
  domain: string,
  maxRetries = 10,
  retryIntervalMs = 2000
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`https://${domain}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const body = (await response.text()).trim();
        if (body === "OK") return true;
      }
    } catch {
      // Keep retrying until the budget is exhausted.
    }
    if (attempt < maxRetries - 1) await sleep(retryIntervalMs);
  }
  return false;
}

/**
 * Publishes a site version to a subdomain or custom domain.
 */
export async function publishSite(
  input: PublishSiteInput,
  options: PublishOptions = {}
): Promise<PublishResult> {
  const { siteId, version, target, customDomain, tenantId } = input;

  if (target === "custom" && !customDomain) {
    throw new PublishError(
      "customDomain is required when target is 'custom'",
      "MISSING_CUSTOM_DOMAIN",
      400
    );
  }

  return withTenant(tenantId, async (tx) => {
    const site = await tx.site.findUnique({
      where: { id: siteId },
      include: { businessProfile: true },
    });

    if (!site) throw new PublishError("Site not found", "SITE_NOT_FOUND", 404);
    if (site.tenantId !== tenantId) {
      throw new PublishError("Site not owned by tenant", "FORBIDDEN", 403);
    }
    if (site.status === "publishing") {
      throw new PublishError("Concurrent publish in progress", "CONCURRENT_PUBLISH", 409);
    }
    if (site.status !== "approved") {
      throw new PublishError("Site status must be 'approved'", "INVALID_STATUS", 400);
    }

    const siteVersion = await tx.siteVersion.findUnique({
      where: { siteId_version: { siteId, version } },
    });
    if (!siteVersion) {
      throw new PublishError(`Version ${version} not found`, "VERSION_NOT_FOUND", 400);
    }

    const pages = (siteVersion.pages as PageSnapshot[] | null) || [];
    const domain =
      target === "custom" ? (customDomain as string) : `${site.subdomain}.${SUBDOMAIN_SUFFIX}`;

    await tx.site.update({ where: { id: siteId }, data: { status: "publishing" } });

    try {
      await deployStaticFiles(tenantId, siteId, pages, domain);

      if (target === "subdomain") {
        const config = generateTraefikConfig({
          tenantId,
          siteId,
          domain,
          isCustomDomain: false,
        });
        await writeTraefikConfigAndReload(tenantId, siteId, config);
      } else {
        const dns = await verifyDns(customDomain as string, options.resolveCname);
        if (!dns.valid) {
          throw new PublishError(
            `CNAME verification failed for ${customDomain}`,
            "DNS_VERIFICATION_FAILED",
            400
          );
        }
        const sans = Array.from(
          new Set([customDomain as string, (customDomain as string).replace(/^www\./, "")])
        );
        const config = generateTraefikConfig({
          tenantId,
          siteId,
          domain,
          isCustomDomain: true,
          sanDomains: sans,
        });
        await writeTraefikConfigAndReload(tenantId, siteId, config);
      }

      const tls = await requestTls(
        domain,
        options.tlsTimeoutMs ?? 60000,
        options.tlsIntervalMs ?? 2000
      );
      if (!tls.success) {
        throw new PublishError(
          `TLS certificate could not be obtained for ${domain}`,
          "TLS_FAILED",
          500
        );
      }

      const healthy = await healthCheck(
        domain,
        options.healthRetries ?? 10,
        options.healthIntervalMs ?? 2000
      );
      if (!healthy) {
        throw new PublishError(
          "Health check failed after deployment",
          "HEALTH_CHECK_FAILED",
          500
        );
      }

      await tx.site.update({
        where: { id: siteId },
        data: {
          status: "published",
          publishedAt: new Date(),
          currentVersionId: siteVersion.id,
          customDomain: target === "custom" ? (customDomain as string) : site.customDomain,
        },
      });

      await tx.publishLog.create({
        data: { siteId, version, action: "publish", target, status: "success", meta: { domain } },
      });

      return { success: true, domain, message: "Sitio publicado correctamente" };
    } catch (error) {
      await tx.site.update({ where: { id: siteId }, data: { status: "approved" } });
      await tx.publishLog
        .create({
          data: {
            siteId,
            version,
            action: "publish",
            target,
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
            meta: { domain },
          },
        })
        .catch(() => undefined);
      throw error;
    }
  });
}

/**
 * Removes a site's routing and marks it unpublished.
 */
export async function unpublishSite(
  siteId: string,
  tenantId: string
): Promise<PublishResult> {
  return withTenant(tenantId, async (tx) => {
    const site = await tx.site.findUnique({
      where: { id: siteId },
      select: { id: true, tenantId: true, subdomain: true, customDomain: true },
    });

    if (!site) throw new PublishError("Site not found", "SITE_NOT_FOUND", 404);
    if (site.tenantId !== tenantId) {
      throw new PublishError("Site not owned by tenant", "FORBIDDEN", 403);
    }

    await removeTraefikConfigAndReload(tenantId, siteId);

    await tx.site.update({ where: { id: siteId }, data: { status: "unpublished" } });
    await tx.publishLog.create({
      data: {
        siteId,
        version: 0,
        action: "unpublish",
        target: site.customDomain ? "custom" : "subdomain",
        status: "success",
      },
    });

    const domain = site.customDomain || `${site.subdomain}.${SUBDOMAIN_SUFFIX}`;
    return { success: true, domain, message: "Sitio despublicado correctamente" };
  });
}
