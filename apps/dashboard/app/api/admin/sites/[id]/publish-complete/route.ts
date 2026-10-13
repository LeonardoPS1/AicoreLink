import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withTenant } from "@/lib/tenant-context";

/**
 * POST /api/admin/sites/[id]/publish-complete
 *
 * Internal endpoint called by the n8n publish workflow to notify the outcome
 * of a publish job. Logs the result and reverts the site on failure.
 */

const BodySchema = z.object({
  jobId: z.string().uuid(),
  siteId: z.string().uuid(),
  tenantId: z.string().uuid(),
  status: z.enum(["completed", "failed"]),
  error: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
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

    const {
      jobId,
      siteId: bodySiteId,
      tenantId,
      status,
      error,
      domain,
    } = BodySchema.parse(body);

    if (siteId !== bodySiteId) {
      return NextResponse.json({ error: "Site ID mismatch" }, { status: 400 });
    }

    const result = await withTenant(tenantId, async (tx) => {
      if (status === "failed") {
        await tx.site.update({ where: { id: siteId }, data: { status: "approved" } });
        await tx.auditLog.create({
          data: {
            tenantId,
            action: "site_publish_failed",
            meta: { jobId, siteId, domain, error },
          },
        });
        return { success: true, message: "Site publish failed; status reverted to approved", siteId };
      }

      await tx.auditLog.create({
        data: { tenantId, action: "site_publish_completed", meta: { jobId, siteId, domain } },
      });
      console.log(`[factory] Site published: ${siteId} (job: ${jobId}, domain: ${domain})`);

      return { success: true, message: "Publish completion logged", siteId };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[factory-publish-complete] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
