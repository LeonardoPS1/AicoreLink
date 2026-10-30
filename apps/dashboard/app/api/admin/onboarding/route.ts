import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { asAdmin } from "@/lib/tenant-context";
import { z } from "zod";

const onboardingSchema = z.object({
  businessName: z.string().min(2),
  rubro: z.string().min(2),
  plan: z.enum(["basico", "intermedio", "completo"]).default("basico"),
  contactEmail: z.string().email(),
  contactWhatsapp: z.string().min(8),
  assignedTo: z.string().optional(),
  founderAgreement: z.boolean().default(false),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const onboardings = await asAdmin(async (tx) => {
      return tx.pilotOnboarding.findMany({
        include: { tenant: true },
        orderBy: { createdAt: "desc" },
      });
    });

    const results = onboardings.map((onb) => ({
      id: onb.id,
      tenantId: onb.tenantId,
      tenantName: onb.tenant.name,
      plan: onb.tenant.plan,
      status: onb.status,
      founderAgreement: onb.founderAgreement,
      checklist: onb.checklist,
      assignedTo: onb.assignedTo,
      startedAt: onb.startedAt.toISOString(),
      completedAt: onb.completedAt?.toISOString() ?? null,
      notes: onb.notes,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("[onboarding GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar onboardings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const result = await asAdmin(async (tx) => {
      const slug = data.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const tenant = await tx.tenant.create({
        data: {
          name: data.businessName,
          slug: `${slug}-${Date.now().toString(36)}`,
          plan: data.plan,
          status: "activo",
        },
      });

      const onboarding = await tx.pilotOnboarding.create({
        data: {
          tenantId: tenant.id,
          status: "pending",
          founderAgreement: data.founderAgreement,
          assignedTo: data.assignedTo,
          checklist: {
            whatsapp_connected: false,
            kb_loaded: false,
            site_published: false,
            billing_active: false,
          },
          notes: `Rubro: ${data.rubro}. Contacto: ${data.contactEmail} / ${data.contactWhatsapp}`,
        },
      });

      return { tenant, onboarding };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[onboarding POST] Error:", error);
    return NextResponse.json({ error: "Error al crear onboarding" }, { status: 500 });
  }
}