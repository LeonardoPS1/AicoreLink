import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const bookSchema = z.object({
  scheduledAt: z.string(),
  duration: z.number().min(15).max(120).default(30),
  professional: z.string().optional(),
  leadId: z.string().optional(),
  conversationId: z.string().optional(),
  notes: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

/**
 * POST /api/tenants/[id]/book
 * Creates an appointment with double-booking prevention.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  try {
    const tenantId = params.id;
    const body = await req.json();
    const parsed = bookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { scheduledAt, duration, professional, leadId, conversationId, notes } = parsed.data;
    const slotStart = new Date(scheduledAt);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    // Check for double-booking
    const conflict = await db.appointment.findFirst({
      where: {
        tenantId,
        status: { not: "cancelado" },
        ...(professional ? { professional } : {}),
        scheduledAt: { lt: slotEnd },
        // Overlap check: existing appointment ends after slot start
      },
    });

    // More precise overlap check
    const existingAppointments = await db.appointment.findMany({
      where: {
        tenantId,
        status: { not: "cancelado" },
        ...(professional ? { professional } : {}),
        scheduledAt: { gte: new Date(slotStart.getTime() - 120 * 60000), lte: slotEnd },
      },
    });

    const hasConflict = existingAppointments.some((apt) => {
      const aptEnd = new Date(apt.scheduledAt.getTime() + apt.duration * 60000);
      return slotStart < aptEnd && slotEnd > apt.scheduledAt;
    });

    if (hasConflict) {
      return NextResponse.json({ error: "Horario no disponible" }, { status: 409 });
    }

    // Also check availability blocks
    const blocks = await db.availabilityBlock.findMany({
      where: {
        tenantId,
        startAt: { lt: slotEnd },
        endAt: { gt: slotStart },
      },
    });

    if (blocks.length > 0) {
      return NextResponse.json({ error: "Horario bloqueado" }, { status: 409 });
    }

    const appointment = await db.appointment.create({
      data: {
        tenantId,
        scheduledAt: slotStart,
        duration,
        professional: professional || null,
        leadId: leadId || null,
        conversationId: conversationId || null,
        notes: notes || null,
        status: "pendiente",
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("[book] Error:", error);
    return NextResponse.json({ error: "Error al agendar" }, { status: 500 });
  }
}