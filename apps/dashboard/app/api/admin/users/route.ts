import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { asAdmin } from "@/lib/tenant-context";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  staffRole: z.string().optional().nullable(),
  tenantId: z.string().optional(),
  tenantRole: z.string().default("cliente"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const users = await asAdmin(async (tx) => {
      return tx.user.findMany({
        include: { tenantLinks: { include: { tenant: true } } },
        orderBy: { createdAt: "desc" },
      });
    });

    const results = users.map((u) => ({
      id: u.id,
      email: u.email,
      staffRole: u.staffRole,
      createdAt: u.createdAt.toISOString(),
      tenants: u.tenantLinks.map((tl) => ({
        tenantId: tl.tenantId,
        tenantName: tl.tenant.name,
        role: tl.role,
      })),
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("[users GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar usuarios" }, { status: 500 });
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
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const existing = await asAdmin(async (tx) => {
      return tx.user.findUnique({ where: { email: data.email } });
    });
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const result = await asAdmin(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          staffRole: data.staffRole ?? null,
        },
      });

      if (data.tenantId) {
        await tx.tenantUser.create({
          data: {
            tenantId: data.tenantId,
            userId: user.id,
            role: data.tenantRole,
          },
        });
      }

      return user;
    });

    return NextResponse.json({ id: result.id, email: result.email }, { status: 201 });
  } catch (error) {
    console.error("[users POST] Error:", error);
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}