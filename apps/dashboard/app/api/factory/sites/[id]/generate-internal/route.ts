import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateSiteDraft } from "@/lib/factory/generator";

/**
 * POST /api/factory/sites/[id]/generate-internal
 *
 * Internal endpoint called by n8n workflow to execute the actual site generation.
 * Requires internal API key authentication.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();

    // Validate internal API key
    const authHeader = request.headers.get("authorization");
    const internalApiKey = process.env.FACTORY_INTERNAL_API_KEY;

    if (!internalApiKey || authHeader !== `Bearer ${internalApiKey}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate body
    const BodySchema = z.object({
      jobId: z.string().uuid(),
      tenantId: z.string().uuid(),
    });
    const { jobId, tenantId } = BodySchema.parse(body);

    // Run the generator
    const draft = await generateSiteDraft(siteId, tenantId);

    return NextResponse.json({
      success: true,
      jobId,
      siteId,
      tenantId,
      draft: {
        pages: draft.pages,
        totalTokens: draft.totalTokens,
        generatedAt: draft.generatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[factory-generate-internal] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}