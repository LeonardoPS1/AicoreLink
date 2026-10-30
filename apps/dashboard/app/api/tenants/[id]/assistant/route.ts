import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const config = await prisma.assistantConfig.findUnique({
    where: { tenantId: params.id },
  });
  return NextResponse.json(config ?? { tenantId: params.id, name: "Aicore Assistant", tone: "amable", language: "es", autoReply: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const config = await prisma.assistantConfig.upsert({
    where: { tenantId: params.id },
    update: {
      name: body.name,
      tone: body.tone,
      language: body.language,
      greeting: body.greeting,
      forbiddenTopics: body.forbiddenTopics,
      autoReply: body.autoReply,
      handoffKeywords: body.handoffKeywords,
    },
    create: {
      tenantId: params.id,
      name: body.name ?? "Aicore Assistant",
      tone: body.tone ?? "amable",
      language: body.language ?? "es",
      greeting: body.greeting,
      forbiddenTopics: body.forbiddenTopics ?? [],
      autoReply: body.autoReply ?? true,
      handoffKeywords: body.handoffKeywords ?? [],
    },
  });
  return NextResponse.json(config);
}
