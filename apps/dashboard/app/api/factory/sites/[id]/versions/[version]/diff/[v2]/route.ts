import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { diffVersions } from "@/lib/factory/versioning";

/**
 * GET /api/factory/sites/[id]/versions/[version]/diff/[v2]
 *
 * Returns semantic diff between two versions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string; v2: string }> }
) {
  try {
    const { id: siteId, version: v1Str, v2: v2Str } = await params;

    // Validate version parameters
    const v1 = parseInt(v1Str, 10);
    const v2 = parseInt(v2Str, 10);
    if (isNaN(v1) || isNaN(v2)) {
      return NextResponse.json(
        { error: "Invalid version numbers" },
        { status: 400 }
      );
    }

    // Get tenantId from header
    const tenantId = request.headers.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Validate site belongs to tenant
    const validation = await withTenant(tenantId, async (tx) => {
      const site = await tx.site.findUnique({
        where: { id: siteId },
        select: { id: true, tenantId: true },
      });

      if (!site) {
        return { error: "Site not found", status: 404 };
      }

      if (site.tenantId !== tenantId) {
        return { error: "Site not owned by tenant", status: 403 };
      }

      return { status: 200 };
    });

    if (validation.status !== 200) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    // Get diff
    const diff = await diffVersions(siteId, v1, v2, tenantId);

    return NextResponse.json(diff);
  } catch (error) {
    console.error("[factory-diff] Error:", error);

    if (error instanceof Error && error.message.startsWith("Version ") && error.message.endsWith(" not found")) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "Site not found") {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "Site not owned by tenant") {
      return NextResponse.json(
        { error: "Site not owned by tenant" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}