import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { asAdmin } from "@/lib/tenant-context";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional(),
  checklist: z.record(z.boolean()).optional(),
  founderAgreement: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await asAdmin(async (tx) => {
      const data: any = {};
      if (parsed.data.status !== undefined) data.status = parsed.data.status;
      if (parsed.data.assignedTo !== undefined) data.assignedTo = parsed.data.assignedTo;
      if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
      if (parsed.data.checklist !== undefined) data.checklist = parsed.data.checklist;
      if (parsed.data.founderAgreement !== undefined) data.founderAgreement = parsed.data.founderAgreement;
      if (parsed.data.status === "completed") data.completedAt = new Date();

      return tx.pilotOnboarding.update({
        where: { id: params.id },
        data,
        include: { tenant: true },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[onboarding PATCH] Error:", error);
    return NextResponse.json({ error: "Error al actualizar onboarding" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    await asAdmin(async (tx) => {
      await tx.pilotOnboarding.delete({ where: { id: params.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[onboarding DELETE] Error:", error);
    return NextResponse.json({ error: "Error al eliminar onboarding" }, { status: 500 });
  }
}