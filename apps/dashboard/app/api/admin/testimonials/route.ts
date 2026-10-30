import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { asAdmin } from "@/lib/tenant-context";
import { z } from "zod";

const updateTestimonialSchema = z.object({
  id: z.string(),
  approved: z.boolean().optional(),
  published: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  try {
    requireRole(session?.user as any, ["dev_aicore"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const testimonials = await asAdmin((tx) =>
      tx.testimonial.findMany({
        include: { tenant: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      })
    );
    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("[admin testimonials GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar testimonios" }, { status: 500 });
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
  const parsed = updateTestimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...data } = parsed.data;

  try {
    const testimonial = await asAdmin((tx) =>
      tx.testimonial.update({
        where: { id },
        data: {
          ...(data.approved !== undefined ? { approved: data.approved } : {}),
          ...(data.published !== undefined ? { published: data.published } : {}),
        },
      })
    );
    return NextResponse.json(testimonial);
  } catch (error) {
    console.error("[admin testimonials PATCH] Error:", error);
    return NextResponse.json({ error: "Error al actualizar testimonio" }, { status: 500 });
  }
}