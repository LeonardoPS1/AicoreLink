import { NextRequest, NextResponse } from "next/server";
import { asAdmin } from "@/lib/tenant-context";

/**
 * GET /api/admin/sites
 *
 * Cross-tenant listing of factory sites for the admin dashboard.
 * Query params: status, rubro, tenant, q (search by name/subdomain).
 * Auth: admin session guard is enforced by the /dashboard/admin layout in production.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const rubro = searchParams.get("rubro") || undefined;
    const tenant = searchParams.get("tenant") || undefined;
    const q = searchParams.get("q")?.trim() || undefined;

    const { sites, stats } = await asAdmin(async (tx) => {
      const sites = await tx.site.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(tenant ? { tenantId: tenant } : {}),
          ...(rubro ? { businessProfile: { rubro } } : {}),
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" as const } },
                  { subdomain: { contains: q, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          subdomain: true,
          customDomain: true,
          status: true,
          updatedAt: true,
          publishedAt: true,
          currentVersionId: true,
          tenant: { select: { id: true, name: true } },
          businessProfile: { select: { rubro: true, name: true } },
          template: { select: { planTier: true } },
        },
      });

      const allSites = await tx.site.findMany({
        select: { status: true },
      });

      const stats = {
        total: allSites.length,
        review: allSites.filter((s: any) => s.status === "review").length,
        published: allSites.filter((s: any) => s.status === "published").length,
        draft: allSites.filter((s: any) => s.status === "draft").length,
      };

      return { sites, stats };
    });

    return NextResponse.json({
      sites: sites.map((site) => ({
        id: site.id,
        name: site.name,
        subdomain: site.subdomain,
        customDomain: site.customDomain,
        status: site.status,
        rubro: site.businessProfile?.rubro ?? null,
        businessName: site.businessProfile?.name ?? null,
        planTier: site.template?.planTier ?? null,
        currentVersionId: site.currentVersionId,
        updatedAt: site.updatedAt.toISOString(),
        publishedAt: site.publishedAt ? site.publishedAt.toISOString() : null,
        tenant: site.tenant ? { id: site.tenant.id, name: site.tenant.name } : null,
      })),
      stats,
    });
  } catch (error) {
    console.error("[admin-sites-list] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
