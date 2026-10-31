import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const params = await ctx.params;
  const body = await req.json();
  const { question } = body;

  // Gather context: daily summary + recent leads + appointments + corrections
  const [leads, appointments, usage, corrections] = await Promise.all([
    db.lead.findMany({ where: { tenantId: params.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.appointment.findMany({ where: { tenantId: params.id }, orderBy: { scheduledAt: "desc" }, take: 10 }),
    db.tenantUsage.findMany({ where: { tenantId: params.id }, orderBy: { period: "desc" }, take: 5 }),
    db.correctionLog.findMany({ where: { tenantId: params.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const context = {
    leadsCount: leads.length,
    appointmentsCount: appointments.length,
    recentLeads: leads.map((l) => ({ name: l.name, status: l.status, source: l.source })),
    recentAppointments: appointments.map((a) => ({ scheduledAt: a.scheduledAt, status: a.status, professional: a.professional })),
    usage: usage.map((u) => ({ period: u.period, messagesIn: u.messagesIn, messagesOut: u.messagesOut, costEstimate: u.costEstimate })),
    corrections: corrections.map((c) => ({ original: c.original, correction: c.correction, context: c.context })),
  };

  // Build learning context from corrections
  const learningContext = corrections.length > 0
    ? `Correcciones aprendidas: ${corrections.map((c) => `"${c.original}" → "${c.correction}"`).join("; ")}.`
    : "";

  // In production, this would call Ollama for AI response. For now, return structured context.
  return NextResponse.json({
    question,
    context,
    answer: `Resumen: ${leads.length} leads recientes, ${appointments.length} citas, ${usage.length} periodos de uso registrados. ${corrections.length} correcciones de aprendizaje aplicadas. ${learningContext}`,
  });
}
