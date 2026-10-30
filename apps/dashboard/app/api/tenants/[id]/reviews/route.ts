import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-context";
import { z } from "zod";

const createReviewSchema = z.object({
  authorName: z.string().min(2),
  authorRole: z.string().optional(),
  content: z.string().min(5),
  rating: z.number().int().min(1).max(5),
  source: z.enum(["manual", "google", "whatsapp"]).default("manual"),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: string | null } | undefined;
  if (!user?.tenantId || user.tenantId !== params.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const reviews = await withTenant(params.id, async (tx) => {
      return tx.testimonial.findMany({
        where: { tenantId: params.id },
        orderBy: { createdAt: "desc" },
      });
    });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

    return NextResponse.json({ reviews, avgRating, total: reviews.length });
  } catch (error) {
    console.error("[reviews GET] Error:", error);
    return NextResponse.json({ error: "Error al cargar reseñas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { tenantId?: string | null } | undefined;
  if (!user?.tenantId || user.tenantId !== params.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const review = await withTenant(params.id, (tx) =>
      tx.testimonial.create({
        data: {
          tenantId: params.id,
          authorName: data.authorName,
          authorRole: data.authorRole,
          content: data.content,
          rating: data.rating,
        },
      })
    );
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("[reviews POST] Error:", error);
    return NextResponse.json({ error: "Error al crear reseña" }, { status: 500 });
  }
}