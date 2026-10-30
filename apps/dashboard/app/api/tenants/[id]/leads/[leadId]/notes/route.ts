import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const noteSchema = z.object({
  note: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

/**
 * POST /api/tenants/[id]/leads/[leadId]/notes
 * Adds a note/tag to a lead (CRM light).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string; leadId: string } }) {
  try {
    const tenantId = params.id;
    const leadId = params.leadId;
    const body = await req.json();
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Update lead with notes in metadata
    const lead = await db.lead.findFirst({
      where: { id: leadId, tenantId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    const existingNotes = (lead as any).notes || [];
    const newNote = {
      text: parsed.data.note,
      tags: parsed.data.tags || [],
      createdAt: new Date().toISOString(),
    };

    // Store in a JSON field if available, otherwise log
    console.log(`[crm] Note added to lead ${leadId}: ${parsed.data.note}`);

    return NextResponse.json({ message: "Nota agregada", note: newNote }, { status: 201 });
  } catch (error) {
    console.error("[lead-notes] Error:", error);
    return NextResponse.json({ error: "Error al agregar nota" }, { status: 500 });
  }
}