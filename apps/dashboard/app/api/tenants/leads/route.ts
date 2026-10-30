import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { withTenant } from "@/lib/tenant-context";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  source: z.string().trim().min(1, "source is required"),
  utmSource: z.string().trim().optional().nullable(),
  utmMedium: z.string().trim().optional().nullable(),
  utmCampaign: z.string().trim().optional().nullable(),
  status: z.string().trim().optional(),
});

// Accept snake_case aliases as well for flexibility.
const createSchemaLoose = z
  .object({
    name: z.string().trim().min(1).optional(),
    nombre: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional().nullable(),
    phone: z.string().trim().optional().nullable(),
    telefono: z.string().trim().optional().nullable(),
    source: z.string().trim().min(1).optional(),
    fuente: z.string().trim().min(1).optional(),
    utmSource: z.string().trim().optional().nullable(),
    utm_source: z.string().trim().optional().nullable(),
    utmMedium: z.string().trim().optional().nullable(),
    utm_medium: z.string().trim().optional().nullable(),
    utmCampaign: z.string().trim().optional().nullable(),
    utm_campaign: z.string().trim().optional().nullable(),
    status: z.string().trim().optional(),
  })
  .transform((v) => ({
    name: v.name ?? v.nombre ?? "",
    email: v.email ?? null,
    phone: v.phone ?? v.telefono ?? null,
    source: v.source ?? v.fuente ?? "",
    utmSource: v.utmSource ?? v.utm_source ?? null,
    utmMedium: v.utmMedium ?? v.utm_medium ?? null,
    utmCampaign: v.utmCampaign ?? v.utm_campaign ?? null,
    status: v.status,
  }))
  .pipe(createSchema);

function resolveTenantId(session: any, requested: string | null): string | null {
  const sessionTenant = session?.user?.tenantId ?? session?.tenantId ?? null;
  const role = session?.user?.role ?? session?.role;
  if (requested && (requested === sessionTenant || role === "dev_aicore")) {
    return requested;
  }
  return sessionTenant;
}

export async function GET(req?: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["cliente", "operador", "dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const searchParams = req?.nextUrl?.searchParams ?? new URLSearchParams();
  const requestedTenant = searchParams.get("tenantId");
  const tenantId = resolveTenantId(session, requestedTenant);
  if (!tenantId) {
    return NextResponse.json({ error: "Sin tenant" }, { status: 400 });
  }

  const status = searchParams.get("status");
  const limitParam = searchParams.get("limit");
  let limit = 50;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!Number.isNaN(parsed)) {
      limit = Math.min(Math.max(parsed, 1), 200);
    }
  }

  try {
    const leads = await withTenant(tenantId, async (tx) => {
      const where: Record<string, unknown> = {};
      if (status && status !== "all") where.status = status;
      return (tx as any).lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    });
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("[tenants/leads GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["cliente", "operador", "dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const requestedTenant = req.nextUrl?.searchParams?.get("tenantId") ?? null;
  const tenantId = resolveTenantId(session, requestedTenant);
  if (!tenantId) {
    return NextResponse.json({ error: "Sin tenant" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const parsed = createSchemaLoose.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const leadData = {
    tenantId,
    name: data.name,
    email: data.email ?? null,
    phone: data.phone ?? null,
    source: data.source,
    utmSource: data.utmSource ?? null,
    utmMedium: data.utmMedium ?? null,
    utmCampaign: data.utmCampaign ?? null,
    status: data.status ?? "nuevo",
  };

  try {
    const lead = await withTenant(tenantId, async (tx) => {
      return (tx as any).lead.create({ data: leadData });
    });
    return NextResponse.json({ ok: true, lead, id: lead?.id }, { status: 201 });
  } catch (error) {
    console.error("[tenants/leads POST] Error:", error);
    return NextResponse.json({ error: "Error al crear lead" }, { status: 500 });
  }
}
