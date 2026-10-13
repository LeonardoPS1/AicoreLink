import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { publishSite, PublishError } from "@/lib/factory/publisher";

/**
 * POST /api/factory/sites/[id]/publish-internal
 *
 * Internal endpoint called by the n8n publish workflow to run the actual
 * deployment. Requires internal API key authentication.
 */

const BodySchema = z.object({
  jobId: z.string().uuid(),
  tenantId: z.string().uuid(),
  version: z.number().int().positive(),
  target: z.enum(["subdomain", "custom"]),
  customDomain: z.string().min(1).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const body = await request.json();

    const authHeader = request.headers.get("authorization");
    const internalApiKey = process.env.FACTORY_INTERNAL_API_KEY;

    if (!internalApiKey || authHeader !== `Bearer ${internalApiKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, tenantId, version, target, customDomain } = BodySchema.parse(body);

    const result = await publishSite({ siteId, version, target, customDomain, tenantId });

    return NextResponse.json({
      success: true,
      jobId,
      siteId,
      tenantId,
      domain: result.domain,
      message: result.message,
    });
  } catch (error) {
    console.error("[factory-publish-internal] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
      );
    }

    if (error instanceof PublishError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
