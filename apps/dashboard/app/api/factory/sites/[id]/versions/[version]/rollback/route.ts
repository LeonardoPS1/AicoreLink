import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { rollback } from "@/lib/factory/versioning";

/**
 * POST /api/factory/sites/[id]/versions/[version]/rollback
 *
 * Rolls back a site to a target version.
 * Creates a NEW version (does not overwrite history).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  try {
    const { id: siteId, version: versionStr } = await params;

    // Validate version parameter
    const targetVersion = parseInt(versionStr, 10);
    if (isNaN(targetVersion)) {
      return NextResponse.json(
        { error: "Invalid version number" },
        { status: 400 }
      );
    }

    // Get tenantId and userId from headers
    const tenantId = request.headers.get("x-tenant-id");
    const userId = request.headers.get("x-user-id") || "system";

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

    // Perform rollback
    const newVersion = await rollback(siteId, targetVersion, userId, tenantId);

    return NextResponse.json({
      newVersion,
      message: `Rollback completado. Nueva versión v${newVersion} creada desde v${targetVersion}.`,
    });
  } catch (error) {
    console.error("[factory-rollback] Error:", error);

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