import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(1),
  rubro: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { email, password, businessName, rubro } = parsed.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create tenant + user + tenantUser in a transaction
    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          slug: businessName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          plan: "basico",
          status: "activo",
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
        },
      });

      await tx.tenantUser.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: "cliente",
        },
      });

      // Enable default channel
      await tx.tenantChannel.create({
        data: {
          tenantId: tenant.id,
          channel: "whatsapp_text",
          enabled: false,
        },
      });

      return { tenant, user };
    });

    return NextResponse.json(
      { message: "Usuario creado exitosamente", userId: result.user.id },
      { status: 201 },
    );
  } catch (error) {
    console.error("[register] Error:", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}