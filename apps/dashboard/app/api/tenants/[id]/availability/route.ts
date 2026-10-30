import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const availabilitySchema = z.object({
  date: z.string(), // YYYY-MM-DD
  duration: z.number().min(15).max(120).default(30),
  professional: z.string().optional(),
});

/**
 * GET /api/tenants/[id]/availability?date=YYYY-MM-DD&duration=30&professional=...
 * Returns available time slots for a given date.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = params.id;
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    const duration = parseInt(url.searchParams.get("duration") || "30", 10);
    const professional = url.searchParams.get("professional") || undefined;

    if (!date) {
      return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });
    }

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    // Get existing appointments for this day
    const appointments = await db.appointment.findMany({
      where: {
        tenantId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        ...(professional ? { professional } : {}),
        status: { not: "cancelado" },
      },
      select: { scheduledAt: true, duration: true },
    });

    // Get availability blocks (breaks, vacations)
    const blocks = await db.availabilityBlock.findMany({
      where: {
        tenantId,
        startAt: { lte: dayEnd },
        endAt: { gte: dayStart },
      },
    });

    // Generate available slots (9:00-18:00, every 30 min)
    const slots: string[] = [];
    const businessStart = 9; // 9 AM
    const businessEnd = 18; // 6 PM

    for (let hour = businessStart; hour < businessEnd; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const slotStart = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        // Check if slot is within business hours
        if (slotEnd.getHours() > businessEnd || (slotEnd.getHours() === businessEnd && slotEnd.getMinutes() > 0)) {
          continue;
        }

        // Check against existing appointments
        const conflict = appointments.some((apt) => {
          const aptEnd = new Date(apt.scheduledAt.getTime() + apt.duration * 60000);
          return slotStart < aptEnd && slotEnd > apt.scheduledAt;
        });

        if (conflict) continue;

        // Check against availability blocks
        const blocked = blocks.some((block) => {
          return slotStart < block.endAt && slotEnd > block.startAt;
        });

        if (blocked) continue;

        slots.push(slotStart.toISOString());
      }
    }

    return NextResponse.json({ slots, date, duration });
  } catch (error) {
    console.error("[availability] Error:", error);
    return NextResponse.json({ error: "Error al calcular disponibilidad" }, { status: 500 });
  }
}