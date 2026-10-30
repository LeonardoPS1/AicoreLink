import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { asAdmin } from "@/lib/tenant-context";
import { z } from "zod";

const invoiceSchema = z.object({
  tenantId: z.string().uuid(),
  invoiceNumber: z.string().min(1),
  invoiceUrl: z.string().url().optional(),
  amount: z.number().positive(),
  currency: z.string().default("CLP"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const billing = await asAdmin((tx) =>
      tx.tenantBilling.upsert({
        where: { tenantId: data.tenantId },
        update: {
          invoiceNumber: data.invoiceNumber,
          invoiceUrl: data.invoiceUrl,
          amount: data.amount,
          currency: data.currency,
          status: "active",
        },
        create: {
          tenantId: data.tenantId,
          plan: "basico",
          amount: data.amount,
          currency: data.currency,
          invoiceNumber: data.invoiceNumber,
          invoiceUrl: data.invoiceUrl,
          status: "active",
        },
      })
    );
    return NextResponse.json(billing, { status: 201 });
  } catch (error) {
    console.error("[billing invoice POST] Error:", error);
    return NextResponse.json({ error: "Error al registrar invoice" }, { status: 500 });
  }
}