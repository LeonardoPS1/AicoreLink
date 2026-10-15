import { getSystemHealth } from "@/lib/panel/health";

/**
 * GET /api/internal/panel/health
 *
 * Internal endpoint backing the Aicore menu health strip. Polled by n8n and
 * other infrastructure checks, so it is never cached. Requires the internal
 * API key; a deploy without the env var fails closed with 401 instead of
 * exposing the system state.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const internalApiKey = process.env.FACTORY_INTERNAL_API_KEY;
  const headerKey = request.headers.get("x-internal-key");

  if (!internalApiKey || headerKey !== internalApiKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(await getSystemHealth());
}
