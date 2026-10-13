import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { generateResponse } from "@/lib/ai/router";
import {
  DEMO_BUSINESSES,
  applyGuardrails,
  demoConfigFor,
  isInjection,
  isPriceRequest,
} from "@/lib/demos/knowledge";
import { demoRateLimiter } from "@/lib/demos/rate-limit";
import { demoRequestSchema } from "@/lib/demos/schema";

export const dynamic = "force-dynamic";

/**
 * Client IP of the request. The rate limit is anchored here, never on the body's
 * `sessionId` — the client controls that field and could rotate it to evade the
 * limit (ruling R17). Mirrors `app/api/leads/route.ts`.
 */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();

  return first || request.headers.get("x-real-ip") || "unknown";
}

/**
 * POST /api/demos — one turn of the public live chat demo.
 *
 * Order is fixed (rulings R17/R18/R20/R21): rate limit (IP + global) → parse JSON
 * → Zod → guardrail pre-filter → local model → guardrail post-filter → reply.
 * The demo only ever calls the local Ollama model, so a public burst can never
 * generate cloud cost (ruling R19).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const decision = demoRateLimiter.take(clientIp(request));

  if (!decision.allowed) {
    return NextResponse.json(
      { error: "Estás enviando muy rápido. Prueba de nuevo en unos segundos." },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud no es JSON válido." },
      { status: 400 },
    );
  }

  const parsed = demoRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Revisa los datos enviados.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { rubro, message, history } = parsed.data;
  const business = DEMO_BUSINESSES[rubro];

  // Pre-filter (R20a/R20c): a price request or a prompt-injection attempt is
  // answered with the rubro's canonical deflection. The model is never called, so
  // these turns cost nothing and can never hallucinate.
  if (isPriceRequest(message) || isInjection(message)) {
    return NextResponse.json({ reply: business.deflection });
  }

  try {
    // `history` is optional; an omitted history is a single-turn request. It is
    // already Zod-validated and capped at 8 turns x 300 chars.
    const result = await generateResponse(message, history ?? [], demoConfigFor(rubro), false);

    // Post-filter (R20b): drop any money figure the model invented.
    return NextResponse.json({ reply: applyGuardrails(result.text, rubro) });
  } catch (error) {
    console.error("[demos] generation failed", error);

    return NextResponse.json(
      { error: "La demo no está disponible en este momento. Prueba más tarde." },
      { status: 503 },
    );
  }
}
