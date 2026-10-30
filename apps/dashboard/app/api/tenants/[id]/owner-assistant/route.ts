import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { question } = body;

  // Gather context: daily summary + recent leads + appointments
  const [leads, appointments, usage] = await Promise.all([
    prisma.lead.findMany({ where: { tenantId: params.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.appointment.findMany({ where: { tenantId: params.id }, orderBy: { scheduledAt: "desc" }, take: 10 }),
    prisma.tenantUsage.findMany({ where: { tenantId: params.id }, orderBy: { period: "desc" }, take: 5 }),
  ]);

  const context = {
    leadsCount: leads.length,
    appointmentsCount: appointments.length,
    recentLeads: leads.map((l) => ({ name: l.name, status: l.status, source: l.source })),
    recentAppointments: appointments.map((a) => ({ scheduledAt: a.scheduledAt, status: a.status, professional: a.professional })),
    usage: usage.map((u) => ({ period: u.period, messagesIn: u.messagesIn, messagesOut: u.messagesOut, costEstimate: u.costEstimate })),
  };

  // In production, this would call Ollama for AI response. For now, return structured context.
  return NextResponse.json({
    question,
    context,
    answer: `Resumen: ${leads.length} leads recientes, ${appointments.length} citas, ${usage.length} periodos de uso registrados.`,
  });
}
