import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/directory?rubro=...&comuna=...&page=1&limit=20
 * Public directory of businesses on AicoreLink.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const rubro = url.searchParams.get("rubro") || undefined;
    const comuna = url.searchParams.get("comuna") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);
    const skip = (page - 1) * limit;

    // Get tenants with business profiles
    const tenants = await db.tenant.findMany({
      where: { status: "activo" },
      include: {
        businessProfiles: true,
        testimonials: { where: { approved: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const directory = tenants
      .filter((t) => {
        const profile = t.businessProfiles[0];
        if (!profile) return false;
        if (rubro && profile.rubro !== rubro) return false;
        if (comuna && profile.address !== comuna) return false;
        return true;
      })
      .map((t) => {
        const profile = t.businessProfiles[0];
        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          rubro: profile?.rubro,
          comuna: profile?.address,
          description: profile?.description,
          testimonials: t.testimonials.length,
          rating: t.testimonials.length > 0
            ? t.testimonials.reduce((sum, tt) => sum + (tt.rating || 5), 0) / t.testimonials.length
            : null,
          reviews: t.testimonials.slice(0, 3).map((tt) => ({
            author: tt.authorName,
            content: tt.content,
            rating: tt.rating,
          })),
        };
      });

    return NextResponse.json({
      directory,
      page,
      limit,
      total: directory.length,
    });
  } catch (error) {
    console.error("[directory] Error:", error);
    return NextResponse.json({ error: "Error al obtener directorio" }, { status: 500 });
  }
}