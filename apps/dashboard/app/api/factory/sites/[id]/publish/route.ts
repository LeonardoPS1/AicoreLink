import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { withTenant } from "@/lib/tenant-context";
import { generateWebhookSignature } from "@/lib/webhook";

/**
 * POST /api/factory/sites/[id]/publish
 *
 * Validates the request and enqueues a publish job. The heavy lifting runs in
 * the n8n workflow, which calls back into /publish-internal.
 */

const BodySchema = z
  .object({
    version: z.number().int().positive(),
    target: z.enum(["subdomain", "custom"]),
    customDomain: z.string().min(1).optional(),
  })
  .refine((data) => data.target !== "custom" || !!data.customDomain, {
    message: "customDomain is required when target is 'custom'",
    path: ["customDomain"],
  });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const body = await request.json().catch(() => ({}));
    const { version, target, customDomain } = BodySchema.parse(body);

    const tenantId = request.headers.get("x-tenant-id");
    if (!tenantId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const validation = await withTenant(tenantId, async (tx) => {
      const site = await tx.site.findUnique({
        where: { id: siteId },
        select: { id: true, tenantId: true, status: true },
      });

      if (!site) return { error: "Site not found", status: 404 };
      if (site.tenantId !== tenantId) {
        return { error: "Site not owned by tenant", status: 403 };
      }
      if (site.status !== "approved") {
        return { error: "Site must be approved before publishing", status: 400 };
      }

      const siteVersion = await tx.siteVersion.findUnique({
        where: { siteId_version: { siteId, version } },
        select: { id: true },
      });
      if (!siteVersion) {
        return { error: `Version ${version} not found`, status: 400 };
      }

      return { ok: true };
    });

    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const jobId = randomUUID();
    const webhookUrl = process.env.N8N_FACTORY_PUBLISH_WEBHOOK_URL;

    if (webhookUrl) {
      const payload = {
        jobId,
        siteId,
        tenantId,
        version,
        target,
        customDomain: customDomain ?? null,
        timestamp: new Date().toISOString(),
      };
      const serialized = JSON.stringify(payload);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const secret = process.env.N8N_FACTORY_PUBLISH_WEBHOOK_SECRET;
      if (secret) {
        headers["X-Signature"] = generateWebhookSignature(serialized, secret);
      }
      // Fire-and-forget: the client gets the job id immediately.
      fetch(webhookUrl, { method: "POST", headers, body: serialized }).catch((error) =>
        console.error("[factory-publish] Webhook dispatch failed:", error)
      );
    } else {
      console.warn("[factory-publish] N8N_FACTORY_PUBLISH_WEBHOOK_URL not set; job not dispatched");
    }

    return NextResponse.json(
      {
        jobId,
        status: "publishing",
        message: "Publicación iniciada. Te avisamos cuando esté live.",
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("[factory-publish] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
