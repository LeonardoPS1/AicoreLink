import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const branches = await prisma.branch.findMany({
    where: { tenantId: params.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(branches);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const branch = await prisma.branch.create({
    data: {
      tenantId: params.id,
      name: body.name,
      address: body.address,
      phone: body.phone,
      active: body.active ?? true,
    },
  });
  return NextResponse.json(branch, { status: 201 });
}
