import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";

// Session- and header-scoped: never prerender at build time.
export const dynamic = "force-dynamic";

/**
 * Endpoint GET: Métricas en tiempo real por tenant
 * 
 * Retorna métricas agregadas para el panel de monitoreo.
 * - Canales activos, mensajes de hoy, consumo del período
 * - Usa withTenant para RLS y aislamiento por tenant
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session?.user as any)?.id;
    const tenantId = (session?.user as any)?.tenantId;

    if (!user || !tenantId) {
      return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
    }

    // Métricas usando withTenant para RLS
    const metrics = await withTenant(tenantId, async (tx) => {
      // Contar canales activados
      const channelCount = await tx.tenantChannel.count({
        where: { tenantId, enabled: true },
      });

      // Última actividad (últimos mensajes hoy)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const recentMessages = await tx.message.count({
        where: {
          tenantId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Consumo actual del período
      const now = new Date();
      const currentPeriod = now.toISOString().split("T")[0];

      const currentUsage = await tx.tenantUsage.findFirst({
        where: { tenantId, period: currentPeriod },
      });

      const totalMessagesIn = currentUsage?.messagesIn ?? 0;
      const totalMessagesOut = currentUsage?.messagesOut ?? 0;
      const totalTokens = currentUsage?.tokensUsed ?? 0;
      const costEstimate = Number(currentUsage?.costEstimate ?? 0);

      return {
        channelCount,
        recentMessages,
        totalMessagesIn,
        totalMessagesOut,
        totalTokens,
        costEstimate,
      };
    });

    return NextResponse.json({
      tenantId,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[metrics/get] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}