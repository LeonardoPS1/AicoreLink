import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rejectSite } from "@/lib/factory/approval";

const BodySchema = z.object({
  reason: z.string().min(1).max(500),
});

/**
 * POST /api/factory/sites/[id]/reject
 *
 * Rejects a site that is in `review`, sending it back to `draft`.
 * Auth: `x-tenant-id` header (session-derived in production).
 * Body: { reason: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = BodySchema.parse(body);

    const tenantId = request.headers.get("x-tenant-id");
    const actor = request.headers.get("x-user-id") || "system";

    if (!tenantId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const result = await rejectSite(siteId, tenantId, reason, actor);

    return NextResponse.json({
      success: true,
      siteId: result.id,
      status: result.status,
      reason: result.reason,
      message: "Sitio rechazado. Vuelve a estado de borrador.",
    });
  } catch (error) {
    console.error("[factory-reject] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Site not found") {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "Site not owned by tenant") {
      return NextResponse.json({ error: "Site not owned by tenant" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "Site status must be 'review'") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
