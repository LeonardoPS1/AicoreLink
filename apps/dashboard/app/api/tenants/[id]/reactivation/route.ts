import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params;
  const campaigns = await db.reactivationCampaign.findMany({
    where: { tenantId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params;
  const body = await req.json();
  const campaign = await db.reactivationCampaign.create({
    data: {
      tenantId: params.id,
      name: body.name,
      audience: body.audience ?? "all",
      message: body.message,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    },
  });
  return NextResponse.json(campaign, { status: 201 });
}
