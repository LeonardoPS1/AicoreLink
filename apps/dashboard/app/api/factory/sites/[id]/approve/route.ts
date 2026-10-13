import { NextRequest, NextResponse } from "next/server";
import { approveSite } from "@/lib/factory/approval";

/**
 * POST /api/factory/sites/[id]/approve
 *
 * Approves a site that is in `review`, enabling it to be published.
 * Auth: `x-tenant-id` header (session-derived in production).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;

    const tenantId = request.headers.get("x-tenant-id");
    const actor = request.headers.get("x-user-id") || "system";

    if (!tenantId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const result = await approveSite(siteId, tenantId, actor);

    return NextResponse.json({
      success: true,
      siteId: result.id,
      status: result.status,
      message: "Sitio aprobado. Ya se puede publicar.",
    });
  } catch (error) {
    console.error("[factory-approve] Error:", error);

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
