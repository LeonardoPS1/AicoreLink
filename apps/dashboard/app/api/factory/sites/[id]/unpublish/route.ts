import { NextRequest, NextResponse } from "next/server";
import { unpublishSite, PublishError } from "@/lib/factory/publisher";

/**
 * POST /api/factory/sites/[id]/unpublish
 *
 * Removes a site's routing (subdomain or custom domain) and marks it
 * `unpublished`. Auth: `x-tenant-id` header (session-derived in production).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;

    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const result = await unpublishSite(siteId, tenantId);

    return NextResponse.json({
      success: result.success,
      siteId,
      domain: result.domain,
      message: result.message,
    });
  } catch (error) {
    console.error("[factory-unpublish] Error:", error);

    if (error instanceof PublishError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
