import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { withTenant } from "@/lib/tenant-context";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["cliente", "operador", "dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Sin tenant" }, { status: 400 });

  const { id } = params;

  let messages;
  try {
    messages = await withTenant(tenantId, async (tx) => {
      return tx.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "asc" },
      });
    });
  } catch (error) {
    console.error("[conversations messages GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar mensajes" }, { status: 500 });
  }

  return NextResponse.json(messages);
}