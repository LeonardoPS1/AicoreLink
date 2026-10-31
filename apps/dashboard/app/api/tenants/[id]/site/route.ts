import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-context";
import { z } from "zod";

const updateSiteSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  description: z.string().optional(),
  hours: z.record(z.any()).optional(),
  services: z.array(z.any()).optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: string | null } | undefined;
  if (!user?.tenantId || user.tenantId !== params.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const result = await withTenant(params.id, async (tx) => {
      const profile = await tx.businessProfile.findUnique({ where: { tenantId: params.id } });
      const site = await tx.site.findFirst({ where: { tenantId: params.id } });
      return { profile, site };
    });

    return NextResponse.json({
      profile: result.profile ? {
        name: result.profile.name,
        rubro: result.profile.rubro,
        phone: result.profile.phone,
        email: result.profile.email,
        address: result.profile.address,
        description: result.profile.description,
        hours: result.profile.hours,
        services: result.profile.services,
        slug: result.profile.slug,
      } : null,
      site: result.site ? {
        id: result.site.id,
        name: result.site.name,
        subdomain: result.site.subdomain,
        customDomain: result.site.customDomain,
        status: result.site.status,
        publishedAt: result.site.publishedAt?.toISOString() ?? null,
      } : null,
    });
  } catch (error) {
    console.error("[site GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar sitio" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: string | null } | undefined;
  if (!user?.tenantId || user.tenantId !== params.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = parsed.data;
    await withTenant(params.id, async (tx) => {
      await tx.businessProfile.update({
        where: { tenantId: params.id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.email !== undefined && { email: data.email || null }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.hours !== undefined && { hours: data.hours }),
          ...(data.services !== undefined && { services: data.services }),
        },
      });
    });

    return NextResponse.json({ ok: true, message: "Sitio actualizado" });
  } catch (error) {
    console.error("[site PUT] Error:", error);
    return NextResponse.json({ error: "Error al actualizar sitio" }, { status: 500 });
  }
}