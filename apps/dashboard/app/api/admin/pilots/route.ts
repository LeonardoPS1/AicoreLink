import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { asAdmin } from "@/lib/tenant-context";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const pilots = await asAdmin(async (tx) => {
      const onboardings = await tx.pilotOnboarding.findMany({
        include: { tenant: true },
        orderBy: { createdAt: "desc" },
      });

      const results = await Promise.all(
        onboardings.map(async (onb) => {
          const tenantId = onb.tenantId;
          const [usage, leads, appointments, followups] = await Promise.all([
            tx.tenantUsage.findMany({ where: { tenantId } }),
            tx.lead.count({ where: { tenantId } }),
            tx.appointment.count({ where: { tenantId } }),
            tx.pilotFollowup.findMany({ where: { tenantId } }),
          ]);

          const totalMessages = usage.reduce(
            (sum, u) => sum + u.messagesIn + u.messagesOut,
            0
          );
          const totalCost = usage.reduce(
            (sum, u) => sum + Number(u.costEstimate),
            0
          );

          const daysSinceStart = Math.floor(
            (Date.now() - onb.startedAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            id: onb.id,
            tenantId,
            tenantName: onb.tenant.name,
            plan: onb.tenant.plan,
            status: onb.status,
            founderAgreement: onb.founderAgreement,
            checklist: onb.checklist,
            assignedTo: onb.assignedTo,
            startedAt: onb.startedAt.toISOString(),
            completedAt: onb.completedAt?.toISOString() ?? null,
            daysSinceStart,
            metrics: {
              messages: totalMessages,
              cost: totalCost,
              leads,
              appointments,
            },
            followups: followups.map((f) => ({
              day: f.day,
              sentAt: f.sentAt?.toISOString() ?? null,
              respondedAt: f.respondedAt?.toISOString() ?? null,
              score: f.score,
            })),
          };
        })
      );

      return results;
    });

    return NextResponse.json(pilots);
  } catch (error) {
    console.error("[pilots GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar pilotos" }, { status: 500 });
  }
}