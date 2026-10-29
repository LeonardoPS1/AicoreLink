import crypto from "crypto";
import { NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-context";
import { recordUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function isAuthorized(request: Request): boolean {
  const internalApiKey = process.env.FACTORY_INTERNAL_API_KEY;
  if (!internalApiKey) return false;
  const headerKey = request.headers.get("x-internal-key");
  if (headerKey && safeEqual(headerKey, internalApiKey)) return true;
  const auth = request.headers.get("authorization");
  if (auth && safeEqual(auth, `Bearer ${internalApiKey}`)) return true;
  return false;
}

function unauthorized(): Response {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizeTenantId(body: any): string | null {
  if (!body || typeof body !== "object") return null;
  return (
    body.tenantId ??
    body.tenant_id ??
    body.tenantID ??
    body.tenant ??
    null
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorized(request)) return unauthorized();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tenantId = normalizeTenantId(body);
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const channel = body?.channel ?? body?.channelName ?? body?.channel_name ?? "whatsapp_text";
  const model =
    body?.model ??
    body?.modelUsed ??
    body?.model_used ??
    body?.modelName ??
    body?.model_name;
  const version =
    body?.version ??
    body?.modelVersion ??
    body?.model_version ??
    body?.versionName ??
    body?.version_name ??
    body?.appVersion ??
    body?.app_version;
  const firstResponseMs =
    body?.firstResponseMs ??
    body?.first_response_ms ??
    body?.firstResponse ??
    body?.first_response ??
    body?.responseTime ??
    body?.response_time ??
    body?.responseMs ??
    body?.response_ms ??
    body?.timeToFirstResponse ??
    body?.time_to_first_response ??
    body?.ttf;
  const tokensIn = Number(
    body?.tokensIn ?? body?.tokens_in ?? body?.inputTokens ?? body?.input_tokens ?? 0
  );
  const tokensOut = Number(
    body?.tokensOut ?? body?.tokens_out ?? body?.outputTokens ?? body?.output_tokens ?? 0
  );
  const tokensUsed = Number(
    body?.tokensUsed ?? body?.tokens_used ?? body?.tokens ?? (tokensIn + tokensOut)
  );

  const messagesIn = Number(
    body?.messagesIn ?? body?.messages_in ?? body?.in ?? body?.incoming ?? 0
  );
  const messagesOut = Number(
    body?.messagesOut ?? body?.messages_out ?? body?.out ?? body?.outgoing ?? 0
  );

  const costEstimate =
    body?.costEstimate ?? body?.cost_estimate ?? body?.cost ?? body?.estimatedCost;

  try {
    const result = await withTenant(String(tenantId), async (tx) => {
      return recordUsage(tx, {
        tenantId: String(tenantId),
        channel: String(channel),
        model,
        version,
        firstResponseMs,
        tokensIn,
        tokensOut,
        tokensUsed: Number.isFinite(tokensUsed) ? tokensUsed : 0,
        messagesIn,
        messagesOut,
        costEstimate,
      });
    });

    return NextResponse.json({ ok: true, success: true, usage: result });
  } catch (err) {
    console.error("[internal/usage] error:", err);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) return unauthorized();

  const url = new URL(request.url);
  const tenantId =
    url.searchParams.get("tenantId") ??
    url.searchParams.get("tenant_id") ??
    url.searchParams.get("tenant");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
  }

  const limitRaw = url.searchParams.get("limit");
  const limit =
    limitRaw == null
      ? 50
      : Number.isFinite(Number(limitRaw))
        ? Number(limitRaw)
        : 50;

  try {
    const usage = await withTenant(String(tenantId), async (tx) => {
      if (tx?.tenantUsage?.findMany) {
        return tx.tenantUsage.findMany({
          where: { tenantId: String(tenantId) },
          orderBy: { period: "desc" },
          take: limit,
        });
      }
      return [];
    });

    return NextResponse.json({ ok: true, success: true, usage });
  } catch (err) {
    console.error("[internal/usage GET] error:", err);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
