import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { notifyNewLead } from "@/lib/leads/notify";
import { leadSchema } from "@/lib/leads/schema";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

/**
 * Best-effort abuse protection. This counter lives in the process, so it resets
 * on deploy and does not span replicas; a shared store (Upstash Redis) is the
 * next step if the landing ever runs more than one instance.
 */
const submissions = new Map<string, { count: number; resetAt: number }>();

function takeToken(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  for (const [existingKey, entry] of submissions) {
    if (entry.resetAt <= now) {
      submissions.delete(existingKey);
    }
  }

  const entry = submissions.get(key);

  if (!entry) {
    submissions.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();

  return first || request.headers.get("x-real-ip") || "unknown";
}

/**
 * Extracts UTM parameters from a URL string.
 */
function extractUtmFromUrl(urlString: string): Record<string, string | undefined> {
  try {
    const url = new URL(urlString);
    return {
      utm_source: url.searchParams.get("utm_source") ?? undefined,
      utm_medium: url.searchParams.get("utm_medium") ?? undefined,
      utm_campaign: url.searchParams.get("utm_campaign") ?? undefined,
      utm_content: url.searchParams.get("utm_content") ?? undefined,
      utm_term: url.searchParams.get("utm_term") ?? undefined,
    };
  } catch {
    return {
      utm_source: undefined,
      utm_medium: undefined,
      utm_campaign: undefined,
      utm_content: undefined,
      utm_term: undefined,
    };
  }
}

/**
 * Merges UTM from body (priority) with UTM from referer/query (fallback).
 * Body values win when present; otherwise falls back to referer then query.
 */
function mergeUtm(
  bodyUtm: Record<string, string | undefined> | undefined,
  refererUtm: Record<string, string | undefined>,
  queryUtm: Record<string, string | undefined>
): Record<string, string | null> {
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
  const merged: Record<string, string | null> = {};

  for (const key of keys) {
    const bodyValue = bodyUtm?.[key];
    const refererValue = refererUtm[key];
    const queryValue = queryUtm[key];

    // Body wins, then referer, then query
    merged[key] = bodyValue ?? refererValue ?? queryValue ?? null;
  }

  return merged;
}

export async function POST(request: NextRequest) {
  const { allowed, retryAfterSeconds } = takeToken(clientIp(request));

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Recibimos varios envíos seguidos. Prueba de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "El cuerpo de la solicitud no es JSON válido." },
      { status: 400 },
    );
  }

  const parsed = leadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Revisa los datos enviados.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { nombre, negocio, whatsapp, rubro, mensaje, utm, consent } = parsed.data;
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

  // Extract UTM from referer (fallback 1) and request URL query params (fallback 2)
  const referer = request.headers.get("referer") ?? "";
  const refererUtm = extractUtmFromUrl(referer);
  const queryUtm = extractUtmFromUrl(request.url);

  // Body UTM (already validated by schema)
  const bodyUtm = utm
    ? {
        utm_source: utm.source,
        utm_medium: utm.medium,
        utm_campaign: utm.campaign,
        utm_content: utm.content,
        utm_term: utm.term,
      }
    : undefined;

  const mergedUtm = mergeUtm(bodyUtm, refererUtm, queryUtm);

  const lead = await db.landingLead.create({
    data: {
      name: nombre,
      business: negocio,
      whatsapp,
      vertical: rubro,
      message: mensaje || null,
      userAgent,
      utmSource: mergedUtm.utm_source,
      utmMedium: mergedUtm.utm_medium,
      utmCampaign: mergedUtm.utm_campaign,
      utmContent: mergedUtm.utm_content,
      utmTerm: mergedUtm.utm_term,
      consent, // z.literal(true) guarantees this is true
    },
    select: { id: true, createdAt: true },
  });

  // The lead is already stored; notifying is a side effect that must never turn a
  // successful submission into an error the visitor would retry.
  try {
    await notifyNewLead({
      id: lead.id,
      name: nombre,
      business: negocio,
      whatsapp,
      vertical: rubro,
      message: mensaje || null,
      userAgent,
      createdAt: lead.createdAt,
      utm: {
        source: mergedUtm.utm_source ?? undefined,
        medium: mergedUtm.utm_medium ?? undefined,
        campaign: mergedUtm.utm_campaign ?? undefined,
        content: mergedUtm.utm_content ?? undefined,
        term: mergedUtm.utm_term ?? undefined,
      },
      consent,
    });
  } catch (error) {
    console.error("[leads] notification step failed", error);
  }

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
