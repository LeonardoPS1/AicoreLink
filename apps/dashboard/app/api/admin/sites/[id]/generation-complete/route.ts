import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";

/**
 * POST /api/admin/sites/[id]/generation-complete
 *
 * Internal endpoint called by n8n workflow to notify completion of generation.
 * Updates site status and sends notifications.
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
      siteId: z.string().uuid(),
      tenantId: z.string().uuid(),
      status: z.enum(["completed", "failed"]),
      error: z.string().nullable().optional(),
      draft: z.any().nullable().optional(),
    });
    const { jobId, siteId: bodySiteId, tenantId, status, error, draft } = BodySchema.parse(body);

    // Verify siteId matches
    if (siteId !== bodySiteId) {
      return NextResponse.json(
        { error: "Site ID mismatch" },
        { status: 400 }
      );
    }

    // Use admin context since this is called by n8n (system)
    const result = await withTenant(tenantId, async (tx) => {
      if (status === "failed") {
        // Update site status back to draft on failure
        await tx.site.update({
          where: { id: siteId },
          data: { status: "draft" },
        });

        // Log error in audit log
        await tx.auditLog.create({
          data: {
            tenantId,
            action: "site_generation_failed",
            meta: { jobId, siteId, error, draft },
          },
        });

        return { success: true, message: "Site status reverted to draft", siteId };
      }

      // Success: site should already be in 'review' status from generator
      // Just log completion
      await tx.auditLog.create({
        data: {
          tenantId,
          action: "site_generation_completed",
          meta: { jobId, siteId, totalTokens: draft?.totalTokens, pageCount: draft?.pages?.length },
        },
      });

      // TODO: Send notification (email, in-app, webhook)
      // For now, just log
      console.log(`[factory] Site generation completed: ${siteId} (job: ${jobId})`);

      return { success: true, message: "Generation completion logged", siteId };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[factory-generation-complete] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}