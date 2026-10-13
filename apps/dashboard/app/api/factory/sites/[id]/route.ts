import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/tenant-context";

/**
 * GET /api/factory/sites/[id]
 *
 * Returns a single site with its business profile, template and review data
 * (pages + version history) so the admin review panel can render client-side.
 * Auth: `x-tenant-id` header (session-derived in production).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;

    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const site = await withTenant(tenantId, async (tx) => {
      return tx.site.findUnique({
        where: { id: siteId },
        include: {
          businessProfile: true,
          template: true,
          pages: {
            orderBy: { order: "asc" },
            select: { id: true, path: true, title: true, content: true, meta: true, order: true },
          },
          versions: {
            orderBy: { version: "desc" },
            select: { id: true, version: true, changelog: true, createdBy: true, createdAt: true },
          },
        },
      });
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (site.tenantId !== tenantId) {
      return NextResponse.json({ error: "Site not owned by tenant" }, { status: 403 });
    }

    return NextResponse.json({
      site: {
        id: site.id,
        tenantId: site.tenantId,
        name: site.name,
        subdomain: site.subdomain,
        customDomain: site.customDomain,
        status: site.status,
        template: site.template
          ? { name: site.template.name, planTier: site.template.planTier }
          : null,
        businessProfile: site.businessProfile
          ? { rubro: site.businessProfile.rubro, name: site.businessProfile.name }
          : null,
        pages: site.pages.map((page) => ({
          id: page.id,
          path: page.path,
          title: page.title,
          content: (page.content as { blocks?: unknown[] }) || { blocks: [] },
          meta: page.meta || {},
          order: page.order,
        })),
        versions: site.versions.map((version) => ({
          id: version.id,
          version: version.version,
          changelog: version.changelog,
          createdBy: version.createdBy,
          createdAt: version.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[factory-site-get] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
