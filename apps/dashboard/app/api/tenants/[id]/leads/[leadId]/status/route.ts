import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { withTenant } from "@/lib/tenant-context";
import { z } from "zod";

const updateSchema = z.object({
  status: z.string().trim().min(1),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; leadId: string }> }
) {
  const params = await ctx.params;
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["cliente", "operador", "dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tenantId = params.id;
  const leadId = params.leadId;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  try {
    const lead = await withTenant(tenantId, async (tx) => {
      return (tx as any).lead.update({
        where: { id: leadId },
        data: { status: parsed.data.status },
      });
    });
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    console.error("[leads status PATCH] Error:", error);
    return NextResponse.json({ error: "Error al actualizar lead" }, { status: 500 });
  }
}
