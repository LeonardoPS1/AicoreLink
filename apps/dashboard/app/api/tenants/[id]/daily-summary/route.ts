import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/tenants/[id]/daily-summary
 * Returns a daily summary: new leads, appointments, conversations, recovered revenue.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = params.id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [newLeads, todayAppointments, conversations, recentAppointments] = await Promise.all([
      db.lead.count({
        where: { tenantId, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      db.appointment.count({
        where: { tenantId, scheduledAt: { gte: startOfDay, lt: endOfDay }, status: { not: "cancelado" } },
      }),
      db.conversation.count({
        where: { tenantId, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      db.appointment.findMany({
        where: { tenantId, scheduledAt: { gte: startOfDay, lt: endOfDay }, status: { not: "cancelado" } },
        select: { scheduledAt: true, professional: true, status: true, duration: true },
        orderBy: { scheduledAt: "asc" },
      }),
    ]);

    // Calculate recovered revenue estimate (appointments * avg ticket)
    const avgTicket = 25000; // CLP estimate
    const recoveredRevenue = todayAppointments * avgTicket;

    return NextResponse.json({
      date: startOfDay.toISOString().split("T")[0],
      newLeads,
      todayAppointments,
      conversations,
      recoveredRevenue,
      appointments: recentAppointments,
      summary: `Hoy: ${newLeads} leads nuevos, ${todayAppointments} citas, ${conversations} conversaciones. Ingresos recuperados estimados: $${recoveredRevenue.toLocaleString("es-CL")} CLP.`,
    });
  } catch (error) {
    console.error("[daily-summary] Error:", error);
    return NextResponse.json({ error: "Error al generar resumen" }, { status: 500 });
  }
}