import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const correction = await prisma.correctionLog.create({
    data: {
      tenantId: params.id,
      original: body.original,
      correction: body.correction,
      context: body.context,
    },
  });
  return NextResponse.json(correction, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const corrections = await prisma.correctionLog.findMany({
    where: { tenantId: params.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(corrections);
}
