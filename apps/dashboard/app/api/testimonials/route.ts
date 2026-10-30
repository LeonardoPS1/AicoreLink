import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-context";
import { z } from "zod";

const createTestimonialSchema = z.object({
  authorName: z.string().min(2),
  authorRole: z.string().optional(),
  content: z.string().min(10),
  rating: z.number().int().min(1).max(5),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: string | null } | undefined;
  const tenantId = user?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createTestimonialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const testimonial = await withTenant(tenantId, (tx) =>
      tx.testimonial.create({
        data: {
          tenantId,
          authorName: data.authorName,
          authorRole: data.authorRole,
          content: data.content,
          rating: data.rating,
        },
      })
    );
    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error("[testimonials POST] Error:", error);
    return NextResponse.json({ error: "Error al crear testimonio" }, { status: 500 });
  }
}