import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { withTenant } from "@/lib/tenant-context";
import { z } from "zod";

const createSchema = z.object({
  scheduledAt: z.string().trim().min(1, "scheduledAt is required"),
  status: z.string().trim().optional(),
  notes: z.string().trim().optional().nullable(),
  leadId: z.string().trim().optional().nullable(),
  conversationId: z.string().trim().optional().nullable(),
});

function resolveTenantId(session: any, requested: string | null): string | null {
  const sessionTenant = session?.user?.tenantId ?? session?.tenantId ?? null;
  const role = session?.user?.role ?? session?.role;
  if (requested && (requested === sessionTenant || role === "dev_aicore")) {
    return requested;
  }
  return sessionTenant;
}

export async function GET(req: NextRequest) {
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

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limitParam = searchParams.get("limit");
  let limit = 50;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!Number.isNaN(parsed)) {
      limit = Math.min(Math.max(parsed, 1), 200);
    }
  }

  const where: Record<string, unknown> = {};
  const scheduledAt: Record<string, Date> = {};
  if (from) scheduledAt.gte = new Date(from);
  if (to) scheduledAt.lte = new Date(to);
  if (Object.keys(scheduledAt).length) where.scheduledAt = scheduledAt;

  try {
    const appointments = await withTenant(tenantId, async (tx) => {
      return (tx as any).appointment.findMany({
        where,
        orderBy: { scheduledAt: "asc" },
        take: limit,
      });
    });
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("[tenants/appointments GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar citas" }, { status: 500 });
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

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const appointmentData = {
    tenantId,
    scheduledAt: data.scheduledAt,
    status: data.status ?? "pendiente",
    notes: data.notes ?? null,
    leadId: data.leadId ?? null,
    conversationId: data.conversationId ?? null,
  };

  try {
    const appointment = await withTenant(tenantId, async (tx) => {
      return (tx as any).appointment.create({ data: appointmentData });
    });
    return NextResponse.json({ ok: true, appointment, id: appointment?.id }, { status: 201 });
  } catch (error) {
    console.error("[tenants/appointments POST] Error:", error);
    return NextResponse.json({ error: "Error al crear cita" }, { status: 500 });
  }
}