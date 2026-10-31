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

    // Get all channel credentials for this tenant
    const credentials = await withTenant(tenantId, async (tx) => {
      return tx.channelCredential.findMany({
        where: { tenantId },
        orderBy: { channel: "asc" },
      });
    });

    // Build health status for each channel using available fields
    const healthStatus = credentials.map((cred) => {
      const createdAt = cred.createdAt ? new Date(cred.createdAt) : null;
      const now = new Date();
      const ageMinutes = createdAt ? Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60)) : 0;

      let status: "online" | "offline" | "error" = "online";

      // If credential is old (>24h), mark as offline
      if (ageMinutes > 24 * 60) {
        status = "offline";
      }

      return {
        channel: cred.channel,
        status,
        provider: cred.provider,
        lastCheckIn: cred.createdAt?.toISOString() ?? null,
        ageMinutes,
      };
    });

    return NextResponse.json({
      tenantId,
      channels: healthStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health/get] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}