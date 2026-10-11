import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { db } from "@/lib/db";
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

export async function POST(request: NextRequest) {
  const { allowed, retryAfterSeconds } = takeToken(clientIp(request));

  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Recibimos varios envíos seguidos. Probá de nuevo en unos minutos." },
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
        error: "Revisá los datos enviados.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { nombre, negocio, whatsapp, rubro, mensaje } = parsed.data;

  const lead = await db.landingLead.create({
    data: {
      name: nombre,
      business: negocio,
      whatsapp,
      vertical: rubro,
      message: mensaje || null,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
