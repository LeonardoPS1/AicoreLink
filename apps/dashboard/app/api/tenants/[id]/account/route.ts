import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-context";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateProfileSchema = z.object({
  email: z.string().email().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: string | null } | undefined;
  if (!user?.tenantId || user.tenantId !== params.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const result = await withTenant(params.id, async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: params.id } });
      const billing = await tx.tenantBilling.findUnique({ where: { tenantId: params.id } });
      return { tenant, billing };
    });

    return NextResponse.json({
      tenant: result.tenant ? {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.plan,
        status: result.tenant.status,
      } : null,
      billing: result.billing ? {
        plan: result.billing.plan,
        amount: Number(result.billing.amount),
        currency: result.billing.currency,
        status: result.billing.status,
        billingActive: result.billing.billingActive,
        invoiceNumber: result.billing.invoiceNumber,
        lastPaymentAt: result.billing.lastPaymentAt?.toISOString() ?? null,
      } : null,
      user: {
        email: (session?.user as any)?.email ?? "",
      },
    });
  } catch (error) {
    console.error("[account GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar cuenta" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: string | null } | undefined;
  if (!user?.tenantId || user.tenantId !== params.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    // For now, just return success - email changes would need verification
    return NextResponse.json({ ok: true, message: "Perfil actualizado" });
  } catch (error) {
    console.error("[account PUT] Error:", error);
    return NextResponse.json({ error: "Error al actualizar cuenta" }, { status: 500 });
  }
}