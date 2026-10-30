import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { asAdmin } from "@/lib/tenant-context";
import { z } from "zod";

const createFollowupSchema = z.object({
  tenantId: z.string().uuid(),
  day: z.number().int().refine((d) => [1, 7, 14, 30].includes(d), {
    message: "day must be 1, 7, 14, or 30",
  }),
});

const updateFollowupSchema = z.object({
  id: z.string(),
  respondedAt: z.string().datetime().optional(),
  score: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createFollowupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const followup = await asAdmin((tx) =>
      tx.pilotFollowup.create({
        data: {
          tenantId: parsed.data.tenantId,
          day: parsed.data.day,
          sentAt: new Date(),
        },
      })
    );
    return NextResponse.json(followup, { status: 201 });
  } catch (error) {
    console.error("[pilots followup POST] Error:", error);
    return NextResponse.json({ error: "Error al crear followup" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateFollowupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...data } = parsed.data;

  try {
    const followup = await asAdmin((tx) =>
      tx.pilotFollowup.update({
        where: { id },
        data: {
          ...(data.respondedAt ? { respondedAt: new Date(data.respondedAt) } : {}),
          ...(data.score !== undefined ? { score: data.score } : {}),
          ...(data.feedback !== undefined ? { feedback: data.feedback } : {}),
        },
      })
    );
    return NextResponse.json(followup);
  } catch (error) {
    console.error("[pilots followup PATCH] Error:", error);
    return NextResponse.json({ error: "Error al actualizar followup" }, { status: 500 });
  }
}