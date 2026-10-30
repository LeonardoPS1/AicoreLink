import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const correction = await db.correctionLog.create({
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
  const corrections = await db.correctionLog.findMany({
    where: { tenantId: params.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(corrections);
}
