import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-context";
import { z } from "zod";

const createTicketSchema = z.object({
  subject: z.string().min(3),
  description: z.string().min(10),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: string | null } | undefined;
  if (!user?.tenantId || user.tenantId !== params.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const tickets = await withTenant(params.id, async (tx) => {
      return tx.supportTicket.findMany({
        where: { tenantId: params.id },
        orderBy: { createdAt: "desc" },
      });
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("[support GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: string | null } | undefined;
  if (!user?.tenantId || user.tenantId !== params.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const ticket = await withTenant(params.id, (tx) =>
      tx.supportTicket.create({
        data: {
          tenantId: params.id,
          subject: data.subject,
          description: data.description,
          priority: data.priority,
        },
      })
    );
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("[support POST] Error:", error);
    return NextResponse.json({ error: "Error al crear ticket" }, { status: 500 });
  }
}