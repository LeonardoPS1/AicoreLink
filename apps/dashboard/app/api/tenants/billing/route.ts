import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";

// Session- and header-scoped: never prerender at build time.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Sin tenant" }, { status: 400 });
    }

    // Helper to get current period (monthly)
    const now = new Date();
    const currentPeriod = now.toISOString().split("T")[0];

    // Get current period usage
    const currentUsage = await withTenant(tenantId, async (tx) => {
      return tx.tenantUsage.findFirst({
        where: { tenantId, period: currentPeriod },
      });
    });

    // Get usage history (last 3 periods)
    const usageHistory = await withTenant(tenantId, async (tx) => {
      return tx.tenantUsage.findMany({
        where: { tenantId },
        orderBy: { period: "desc" },
        take: 3,
      });
    });

    // Convert Decimal to number safely
    const safeDecimal = (val: any): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === "number") return val;
      return Number(val);
    };

    return NextResponse.json({
      currentPeriod,
      currentUsage: {
        messagesIn: currentUsage?.messagesIn ?? 0,
        messagesOut: currentUsage?.messagesOut ?? 0,
        tokensUsed: currentUsage?.tokensUsed ?? 0,
        costEstimate: safeDecimal(currentUsage?.costEstimate),
      },
      usageHistory: usageHistory.map((u) => ({
        period: u.period?.toISOString().split("T")[0] ?? "",
        messagesIn: u.messagesIn ?? 0,
        messagesOut: u.messagesOut ?? 0,
        tokensUsed: u.tokensUsed ?? 0,
        costEstimate: safeDecimal(u.costEstimate),
      })),
    });
  } catch (error) {
    console.error("[billing/get] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}