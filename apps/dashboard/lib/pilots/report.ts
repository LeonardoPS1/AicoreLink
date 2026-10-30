import { asAdmin } from "@/lib/tenant-context";

export interface PilotReport {
  generatedAt: string;
  totalPilots: number;
  completedOnboardings: number;
  totalMessages: number;
  totalCost: number;
  totalLeads: number;
  totalAppointments: number;
  totalTestimonials: number;
  publishedTestimonials: number;
  pilots: Array<{
    tenantName: string;
    plan: string;
    status: string;
    daysSinceStart: number;
    messages: number;
    cost: number;
    leads: number;
    appointments: number;
    followupsResponded: number;
    followupsTotal: number;
  }>;
  markdown: string;
}

export async function generatePilotReport(): Promise<PilotReport> {
  const data = await asAdmin(async (tx) => {
    const onboardings = await tx.pilotOnboarding.findMany({
      include: { tenant: true },
      orderBy: { createdAt: "asc" },
    });

    const testimonials = await tx.testimonial.findMany();
    const publishedCount = testimonials.filter((t) => t.published).length;

    let totalMessages = 0;
    let totalCost = 0;
    let totalLeads = 0;
    let totalAppointments = 0;

    const pilots = await Promise.all(
      onboardings.map(async (onb) => {
        const tenantId = onb.tenantId;
        const [usage, leads, appointments, followups] = await Promise.all([
          tx.tenantUsage.findMany({ where: { tenantId } }),
          tx.lead.count({ where: { tenantId } }),
          tx.appointment.count({ where: { tenantId } }),
          tx.pilotFollowup.findMany({ where: { tenantId } }),
        ]);

        const messages = usage.reduce((s, u) => s + u.messagesIn + u.messagesOut, 0);
        const cost = usage.reduce((s, u) => s + Number(u.costEstimate), 0);

        totalMessages += messages;
        totalCost += cost;
        totalLeads += leads;
        totalAppointments += appointments;

        const daysSinceStart = Math.floor(
          (Date.now() - onb.startedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          tenantName: onb.tenant.name,
          plan: onb.tenant.plan,
          status: onb.status,
          daysSinceStart,
          messages,
          cost,
          leads,
          appointments,
          followupsResponded: followups.filter((f) => f.respondedAt).length,
          followupsTotal: followups.length,
        };
      })
    );

    const completedOnboardings = onboardings.filter((o) => o.status === "completed").length;

    // Generate markdown
    const lines: string[] = [];
    lines.push("# Informe de Pilotos — AicoreLink");
    lines.push("");
    lines.push(`**Generado:** ${new Date().toISOString()}`);
    lines.push("");
    lines.push("## Resumen");
    lines.push("");
    lines.push(`- Total pilotos: ${onboardings.length}`);
    lines.push(`- Onboardings completados: ${completedOnboardings}`);
    lines.push(`- Mensajes totales: ${totalMessages}`);
    lines.push(`- Costo total: $${totalCost.toFixed(2)}`);
    lines.push(`- Leads totales: ${totalLeads}`);
    lines.push(`- Citas totales: ${totalAppointments}`);
    lines.push(`- Testimonios: ${testimonials.length} (${publishedCount} publicados)`);
    lines.push("");
    lines.push("## Detalle por piloto");
    lines.push("");
    lines.push("| Tenant | Plan | Estado | Dias | Msgs | Costo | Leads | Citas | Seguimiento |");
    lines.push("|---|---|---|---|---|---|---|---|---|");
    for (const p of pilots) {
      lines.push(
        `| ${p.tenantName} | ${p.plan} | ${p.status} | ${p.daysSinceStart} | ${p.messages} | $${p.cost.toFixed(2)} | ${p.leads} | ${p.appointments} | ${p.followupsResponded}/${p.followupsTotal} |`
      );
    }
    lines.push("");
    lines.push("## Backlog v1.1 priorizado");
    lines.push("");
    lines.push("- (Completar manualmente con decisiones del equipo)");
    lines.push("");

    return {
      generatedAt: new Date().toISOString(),
      totalPilots: onboardings.length,
      completedOnboardings,
      totalMessages,
      totalCost,
      totalLeads,
      totalAppointments,
      totalTestimonials: testimonials.length,
      publishedTestimonials: publishedCount,
      pilots,
      markdown: lines.join("\n"),
    };
  });

  return data;
}