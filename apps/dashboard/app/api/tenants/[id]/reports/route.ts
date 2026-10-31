import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-context";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: string | null } | undefined;
  if (!user?.tenantId || user.tenantId !== params.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "30d";

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const result = await withTenant(params.id, async (tx) => {
      const [leads, conversations, appointments, usage] = await Promise.all([
        tx.lead.findMany({ where: { tenantId: params.id, createdAt: { gte: since } } }),
        tx.conversation.findMany({ where: { tenantId: params.id, createdAt: { gte: since } } }),
        tx.appointment.findMany({ where: { tenantId: params.id, createdAt: { gte: since } } }),
        tx.tenantUsage.findMany({ where: { tenantId: params.id, period: { gte: since } } }),
      ]);

      const leadsByStatus = leads.reduce((acc: Record<string, number>, l) => {
        acc[l.status] = (acc[l.status] ?? 0) + 1;
        return acc;
      }, {});

      const convsByStatus = conversations.reduce((acc: Record<string, number>, c) => {
        acc[c.status] = (acc[c.status] ?? 0) + 1;
        return acc;
      }, {});

      const apptsByStatus = appointments.reduce((acc: Record<string, number>, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      }, {});

      const totalMessages = usage.reduce((sum, u) => sum + u.messagesIn + u.messagesOut, 0);
      const totalCost = usage.reduce((sum, u) => sum + Number(u.costEstimate), 0);
      const totalTokens = usage.reduce((sum, u) => sum + u.tokensUsed, 0);

      const conversionRate = leads.length > 0
        ? ((appointments.length / leads.length) * 100).toFixed(1)
        : "0";

      return {
        period,
        days,
        leads: { total: leads.length, byStatus: leadsByStatus },
        conversations: { total: conversations.length, byStatus: convsByStatus },
        appointments: { total: appointments.length, byStatus: apptsByStatus },
        usage: { totalMessages, totalCost, totalTokens },
        conversionRate: `${conversionRate}%`,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[reports GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar reportes" }, { status: 500 });
  }
}