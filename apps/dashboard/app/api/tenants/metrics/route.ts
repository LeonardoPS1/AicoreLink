import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["cliente", "admin_clinica", "dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Sin tenant" }, { status: 400 });
  }

  const conversations = await withTenant(tenantId, async (tx) => {
    return tx.conversation.count({
      where: { tenantId },
    });
  });

  const openConversations = await withTenant(tenantId, async (tx) => {
    return tx.conversation.count({
      where: { tenantId, status: "abierta" },
    });
  });

  const escalatedConversations = await withTenant(tenantId, async (tx) => {
    return tx.conversation.count({
      where: { tenantId, escalado: true },
    });
  });

  const closedConversations = await withTenant(tenantId, async (tx) => {
    return tx.conversation.count({
      where: { tenantId, status: "cerrada" },
    });
  });

  const usage = await withTenant(tenantId, async (tx) => {
    return tx.tenantUsage.findMany({
      where: { tenantId },
      orderBy: { period: "desc" },
      take: 1,
    });
  });

  const totalMessagesIn = (usage?.[0]?.messagesIn ?? 0);
  const totalMessagesOut = (usage?.[0]?.messagesOut ?? 0);
  const totalTokensUsed = (usage?.[0]?.tokensUsed ?? 0);
  const costEstimate = (usage?.[0]?.costEstimate ?? 0).toNumber();

  const result = {
    conversations: {
      total: conversations,
      open: openConversations,
      escalated: escalatedConversations,
      closed: closedConversations,
    },
    usage: {
      messagesIn: totalMessagesIn,
      messagesOut: totalMessagesOut,
      tokensUsed: totalTokensUsed,
      costEstimate,
    },
    period: usage?.[0]?.period
      ? usage[0].period.toISOString().split("T")[0]
      : null,
  };

  return NextResponse.json(result);
}