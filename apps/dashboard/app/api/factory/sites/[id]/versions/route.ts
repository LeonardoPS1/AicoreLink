import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { createVersion, getVersions } from "@/lib/factory/versioning";

/**
 * GET /api/factory/sites/[id]/versions
 *
 * Returns all versions for a site, ordered by version DESC.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;

    // Get tenantId from header (in production, from session)
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

    // Get versions
    const versions = await getVersions(siteId, tenantId);

    return NextResponse.json(versions);
  } catch (error) {
    console.error("[factory-versions-get] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/factory/sites/[id]/versions
 *
 * Creates a new version from current pages.
 * Body: { changelog: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const body = await request.json().catch(() => ({}));

    // Validate body
    const BodySchema = z.object({
      changelog: z.string().min(1).max(500),
    });
    const { changelog } = BodySchema.parse(body);

    // Get tenantId and userId from headers (in production, from session)
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

    // Create new version
    const version = await createVersion(siteId, changelog, userId, tenantId);

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error("[factory-versions-post] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
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