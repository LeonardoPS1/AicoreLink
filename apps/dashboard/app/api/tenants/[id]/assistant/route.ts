import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params;
  const config = await db.assistantConfig.findUnique({
    where: { tenantId: params.id },
  });
  return NextResponse.json(config ?? { tenantId: params.id, name: "Aicore Assistant", tone: "amable", language: "es", autoReply: true });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params;
  const body = await req.json();
  const config = await db.assistantConfig.upsert({
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
