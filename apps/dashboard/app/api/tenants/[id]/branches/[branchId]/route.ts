import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; branchId: string }> }
) {
  const params = await ctx.params;
  const body = await req.json();
  const branch = await db.branch.update({
    where: { id: params.branchId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.active !== undefined && { active: body.active }),
    },
  });
  return NextResponse.json(branch);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; branchId: string }> }
) {
  const params = await ctx.params;
  await db.branch.delete({ where: { id: params.branchId } });
  return NextResponse.json({ ok: true });
}
