import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { withTenant } from "@/lib/tenant-context";

export async function GET(req: NextRequest) {
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

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let conversations;
  try {
    conversations = await withTenant(tenantId, async (tx) => {
      const where: Record<string, unknown> = {
        channel: "whatsapp_text",
      };
      if (status && status !== "all") where.status = status;
      if (search) where.contactRef = { contains: search, mode: "insensitive" };

      return tx.conversation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
      });
    });
  } catch (error) {
    console.error("[conversations GET] Error:", error);
    return NextResponse.json(
      { error: "Error al cargar conversaciones" },
      { status: 500 }
    );
  }

  const result = conversations.map((c) => ({
    id: c.id,
    contactRef: c.contactRef,
    status: c.status,
    escalado: c.escalado,
    createdAt: c.createdAt.toISOString(),
    lastMessage: c.messages[0]?.content ?? null,
    lastMessageAt: c.messages[0]?.createdAt.toISOString() ?? null,
    unreadCount: 0,
  }));

  return NextResponse.json(result);
}