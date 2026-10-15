// Infrastructure health probes for the Aicore main menu (design §6 / §8, plan F1 task 3).
//
// Every probe is isolated: its own try/catch and its own timeout, so a single
// hanging or dead dependency can never hang the menu. A missing environment
// variable is reported as `sin_datos` — never `ok` and never `caido` — because
// an unconfigured integration is not evidence of anything.

import { FAILED_PUBLISH_WINDOW_MS } from "./risk";

export type HealthStatus = "ok" | "degradado" | "caido" | "sin_datos";

export interface HealthService {
  key: string;
  label: string;
  status: HealthStatus;
  detail: string | null;
  checkedAt: string;
}

export interface SystemHealth {
  services: HealthService[];
  checkedAt: string;
}

export interface HealthDeps {
  now?: () => Date;
  fetchFn?: typeof fetch;
  pingPostgres?: () => Promise<number>;
  lastPublishFailure?: () => Promise<Date | null>;
  /** Overridable so a test can prove a hanging probe gives up quickly. */
  probeTimeoutMs?: number;
}

/** Any single probe gives up after this long (Review Focus 5). */
const PROBE_TIMEOUT_MS = 3000;

const POSTGRES_FAST_MS = 500;
// Anything that answered at all is "degradado" rather than "caido": the probe
// only gives up at the probe timeout, so that is the ceiling.
const POSTGRES_SLOW_MS = PROBE_TIMEOUT_MS;

/**
 * Sentinel returned by `HealthDeps.lastPublishFailure` when the publishing
 * pipeline has produced rows but none of them failed: the pipeline is healthy,
 * which is different from having no data to judge (`null`).
 */
export const NO_FAILURES = new Date(0);

function hasFailures(value: Date): boolean {
  return value.getTime() !== 0;
}

/**
 * A database query cannot be aborted through Prisma, but the menu must not wait
 * for it either: this rejects the race so the probe reports `caido` and the rest
 * of the dashboard still renders (Review Focus 5).
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} no respondió en ${ms} ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Never leak a URL or a credential through the health detail. */
function redact(text: string): string {
  return text
    .replace(/[a-z][a-z0-9+.-]*:\/\/\S*/gi, "<url>")
    .replace(/\b[A-Za-z0-9_-]{24,}\b/g, "<redacted>");
}

function trimSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

async function probeUrl(
  fetchFn: typeof fetch,
  url: string,
  timeoutMs: number,
  headers?: Record<string, string>,
): Promise<{ status: HealthStatus; detail: string | null }> {
  try {
    const response = await fetchFn(url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (response.ok) {
      return { status: "ok", detail: null };
    }
    return { status: "degradado", detail: `respondió HTTP ${response.status}` };
  } catch (error) {
    return { status: "caido", detail: redact(errorText(error)) };
  }
}

async function probePostgres(
  pingPostgres: () => Promise<number>,
  checkedAt: string,
  timeoutMs: number,
): Promise<HealthService> {
  const service = { key: "postgres", label: "Base de datos", checkedAt };
  try {
    const elapsed = await withTimeout(
      pingPostgres(),
      timeoutMs,
      "la base de datos",
    );
    const rounded = Math.round(elapsed);
    if (elapsed < POSTGRES_FAST_MS) {
      return { ...service, status: "ok", detail: `respondió en ${rounded} ms` };
    }
    if (elapsed < POSTGRES_SLOW_MS) {
      return { ...service, status: "degradado", detail: `respondió en ${rounded} ms` };
    }
    return { ...service, status: "caido", detail: `respondió en ${rounded} ms` };
  } catch (error) {
    return { ...service, status: "caido", detail: redact(errorText(error)) };
  }
}

async function probeN8n(
  fetchFn: typeof fetch,
  checkedAt: string,
  timeoutMs: number,
): Promise<HealthService> {
  const service = { key: "n8n", label: "Automatizaciones (n8n)", checkedAt };
  const baseUrl = process.env.N8N_BASE_URL;
  if (!baseUrl) {
    return { ...service, status: "sin_datos", detail: "N8N_BASE_URL sin configurar" };
  }
  return {
    ...service,
    ...(await probeUrl(fetchFn, `${trimSlash(baseUrl)}/healthz`, timeoutMs)),
  };
}

async function probeOllama(
  fetchFn: typeof fetch,
  checkedAt: string,
  timeoutMs: number,
): Promise<HealthService> {
  const service = { key: "ollama", label: "IA local (Ollama)", checkedAt };
  // No hardcoded fallback host: probing a guessed address would report `caido`
  // (or `ok`) for an integration that was simply never configured, which is the
  // false alarm Review Focus 3 forbids.
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) {
    return { ...service, status: "sin_datos", detail: "OLLAMA_BASE_URL sin configurar" };
  }
  return {
    ...service,
    ...(await probeUrl(fetchFn, `${trimSlash(baseUrl)}/api/tags`, timeoutMs)),
  };
}

async function probeWhatsapp(
  fetchFn: typeof fetch,
  checkedAt: string,
  timeoutMs: number,
): Promise<HealthService> {
  const service = { key: "whatsapp", label: "Entrega de WhatsApp", checkedAt };
  const baseUrl = process.env.CHATWOOT_BASE_URL;
  const token = process.env.CHATWOOT_API_TOKEN;
  if (!baseUrl || !token) {
    const missing = [
      !baseUrl ? "CHATWOOT_BASE_URL" : null,
      !token ? "CHATWOOT_API_TOKEN" : null,
    ].filter((name): name is string => name !== null);
    return { ...service, status: "sin_datos", detail: `${missing.join(", ")} sin configurar` };
  }
  return {
    ...service,
    ...(await probeUrl(
      fetchFn,
      `${trimSlash(baseUrl)}/api/v1/accounts`,
      timeoutMs,
      { api_access_token: token },
    )),
  };
}

async function probeSitePublishing(
  lastPublishFailure: () => Promise<Date | null>,
  checkedAt: string,
  now: () => Date,
  timeoutMs: number,
): Promise<HealthService> {
  const service = { key: "sitePublishing", label: "Publicación de sitios", checkedAt };
  try {
    const lastFailure = await withTimeout(
      lastPublishFailure(),
      timeoutMs,
      "la consulta de publicaciones",
    );
    if (lastFailure === null) {
      return { ...service, status: "sin_datos", detail: "sin publicaciones registradas todavía" };
    }
    if (!hasFailures(lastFailure)) {
      return { ...service, status: "ok", detail: "sin fallas de publicación" };
    }
    const iso = lastFailure.toISOString();
    const fresh = now().getTime() - lastFailure.getTime() <= FAILED_PUBLISH_WINDOW_MS;
    return {
      ...service,
      status: fresh ? "degradado" : "ok",
      detail: `última publicación fallida: ${iso}`,
    };
  } catch (error) {
    return { ...service, status: "caido", detail: redact(errorText(error)) };
  }
}

// Imported lazily: `lib/db` throws at import time when DATABASE_URL is missing,
// and the menu must still render its other probes in that situation.
async function defaultPingPostgres(): Promise<number> {
  const { db } = await import("@/lib/db");
  const started = performance.now();
  await db.$queryRaw`SELECT 1`;
  return performance.now() - started;
}

async function defaultLastPublishFailure(): Promise<Date | null> {
  const { db } = await import("@/lib/db");
  const [anyRow, failedRow] = await Promise.all([
    db.publishLog.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    db.publishLog.findFirst({
      where: { status: "failed" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);
  if (!anyRow) {
    return null;
  }
  return failedRow?.createdAt ?? NO_FAILURES;
}

export async function getSystemHealth(deps: HealthDeps = {}): Promise<SystemHealth> {
  const now = deps.now ?? (() => new Date());
  const fetchFn = deps.fetchFn ?? fetch;
  const pingPostgres = deps.pingPostgres ?? defaultPingPostgres;
  const lastPublishFailure = deps.lastPublishFailure ?? defaultLastPublishFailure;
  const timeoutMs = deps.probeTimeoutMs ?? PROBE_TIMEOUT_MS;
  const checkedAt = now().toISOString();

  const services = await Promise.all([
    probePostgres(pingPostgres, checkedAt, timeoutMs),
    probeN8n(fetchFn, checkedAt, timeoutMs),
    probeOllama(fetchFn, checkedAt, timeoutMs),
    probeWhatsapp(fetchFn, checkedAt, timeoutMs),
    probeSitePublishing(lastPublishFailure, checkedAt, now, timeoutMs),
  ]);

  return { services, checkedAt };
}
