import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaigns = await prisma.reactivationCampaign.findMany({
    where: { tenantId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const campaign = await prisma.reactivationCampaign.create({
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
