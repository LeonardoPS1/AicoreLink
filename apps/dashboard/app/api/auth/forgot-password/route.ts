import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import crypto from "crypto";

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({ message: "Si el email existe, recibirás instrucciones" });
    }

    // Invalidate old tokens
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: send email with reset link via n8n or email service
    // For now, log the token (in production, send via email)
    console.log(`[forgot-password] Reset token for ${email}: ${token}`);

    return NextResponse.json({ message: "Si el email existe, recibirás instrucciones" });
  } catch (error) {
    console.error("[forgot-password] Error:", error);
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 });
  }
}