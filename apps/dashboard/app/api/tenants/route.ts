import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { asAdmin } from "@/lib/tenant-context";
import { z } from "zod";

const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "slug debe ser minusculas, numeros y guiones"),
  plan: z.enum(["basico", "intermedio", "completo"]).default("basico"),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let tenants;
  try {
    tenants = await asAdmin((tx) => tx.tenant.findMany({ orderBy: { createdAt: "desc" } }));
  } catch (error) {
    console.error("[tenants GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar tenants" }, { status: 500 });
  }
  return NextResponse.json(tenants);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tenant = await asAdmin((tx) => tx.tenant.create({ data: parsed.data }));
  return NextResponse.json(tenant, { status: 201 });
}
