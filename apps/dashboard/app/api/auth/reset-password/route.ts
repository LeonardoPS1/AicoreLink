import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { token, password } = parsed.data;

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });
    });

    return NextResponse.json({ message: "Contraseña actualizada exitosamente" });
  } catch (error) {
    console.error("[reset-password] Error:", error);
    return NextResponse.json({ error: "Error al actualizar contraseña" }, { status: 500 });
  }
}