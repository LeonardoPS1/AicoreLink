import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { asAdmin } from "@/lib/tenant-context";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateSchema = z.object({
  staffRole: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
  tenantRole: z.string().optional(),
  tenantId: z.string().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
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
      if (parsed.data.staffRole !== undefined) data.staffRole = parsed.data.staffRole;
      if (parsed.data.password) {
        data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
      }

      const user = await tx.user.update({
        where: { id: params.id },
        data,
      });

      // Update tenant role if provided
      if (parsed.data.tenantId && parsed.data.tenantRole) {
        await tx.tenantUser.updateMany({
          where: { userId: params.id, tenantId: parsed.data.tenantId },
          data: { role: parsed.data.tenantRole },
        });
      }

      return user;
    });

    return NextResponse.json({ id: result.id, email: result.email, staffRole: result.staffRole });
  } catch (error) {
    console.error("[users PATCH] Error:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    await asAdmin(async (tx) => {
      await tx.tenantUser.deleteMany({ where: { userId: params.id } });
      await tx.passwordResetToken.deleteMany({ where: { userId: params.id } });
      await tx.user.delete({ where: { id: params.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[users DELETE] Error:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}