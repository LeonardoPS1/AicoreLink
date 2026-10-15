import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { withTenant } from "@/lib/tenant-context";
import { CHANNELS } from "@/lib/entitlements";
import { z } from "zod";

const configSchema = z.object({
  tone: z.enum(["formal", "amable", "empatico"]).optional(),
  businessHours: z.string().optional(),
  knowledgeBase: z.string().optional(),
  autoReplyEnabled: z.boolean().optional(),
  preferLocalAi: z.boolean().optional(),
  maxTokensResponse: z.number().int().min(100).max(2000).optional(),
  escalationKeywords: z.array(z.string()).optional(),
  escalationNotify: z.enum(["email", "telegram", "none"]).optional(),
  escalationMessage: z.string().optional(),
  descripcion: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["cliente", "operador", "dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Sin tenant" }, { status: 400 });
  }

  let channels;
  try {
    channels = await withTenant(tenantId, async (tx) => {
      return tx.tenantChannel.findMany({
        where: { tenantId },
      });
    });
  } catch (error) {
    console.error("[channels GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar canales" }, { status: 500 });
  }

  return NextResponse.json(channels);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["cliente", "operador", "dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Sin tenant" }, { status: 400 });
  }

  const body = await req.json();
  const { channel, enabled, config } = body;

  if (!CHANNELS.includes(channel)) {
    return NextResponse.json({ error: "Canal invalido" }, { status: 400 });
  }

  const parsedConfig = configSchema.safeParse(config ?? {});
  if (!parsedConfig.success) {
    return NextResponse.json(
      { error: parsedConfig.error.flatten() },
      { status: 400 }
    );
  }

  try {
    // The client panel writes through the RLS connection: tenantId comes from
    // the session and the policy's USING clause doubles as WITH CHECK, so RLS
    // keeps enforcing the tenant even if this where clause were wrong.
    const result = await withTenant(tenantId, async (tx) => {
      return tx.tenantChannel.upsert({
        where: { tenantId_channel: { tenantId, channel } },
        update: { enabled, config: parsedConfig.data, descripcion: parsedConfig.data?.descripcion },
        create: { tenantId, channel, enabled, config: parsedConfig.data, descripcion: parsedConfig.data?.descripcion },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[channels PUT] Error:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}