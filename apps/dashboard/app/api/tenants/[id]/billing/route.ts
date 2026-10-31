import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params;
  const session = await getServerSession(authOptions);
  const tenantId = params.id;

  try {
    const billings = await db.tenantBilling.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(billings);
  } catch (error) {
    console.error("[tenants/billing GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar facturación" }, { status: 500 });
  }
}
