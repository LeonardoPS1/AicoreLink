import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * POST /api/factory/sites/[id]/generate
 *
 * Triggers async site generation via n8n webhook.
 * Returns 202 with jobId immediately.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: siteId } = await params;
    const body = await request.json().catch(() => ({}));

    // Validate empty body (all data comes from site)
    const BodySchema = z.object({}).strict();
    BodySchema.parse(body);

    // Get tenantId from auth (in real app, from session)
    // For now, we'll get it from a header or use a placeholder
    // In production, this should come from NextAuth session
    const tenantId = request.headers.get("x-tenant-id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Validate site belongs to tenant and is in draft status
    const validation = await withTenant(tenantId, async (tx) => {
      const site = await tx.site.findUnique({
        where: { id: siteId },
        include: { businessProfile: true },
      });

      if (!site) {
        return { error: "Site not found", status: 404 };
      }

      if (site.tenantId !== tenantId) {
        return { error: "Site not owned by tenant", status: 403 };
      }

      if (site.status !== "draft") {
        return { error: "Site status must be 'draft'", status: 400 };
      }

      if (!site.businessProfile) {
        return { error: "BusinessProfile not found", status: 400 };
      }

      return { site, status: 200 };
    });

    if (validation.status !== 200) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    // Generate jobId for tracking
    const jobId = randomUUID();

    // Emit n8n webhook for async generation
    const n8nWebhookUrl = process.env.N8N_FACTORY_GENERATE_WEBHOOK_URL;
    const n8nWebhookSecret = process.env.N8N_FACTORY_GENERATE_WEBHOOK_SECRET;

    if (n8nWebhookUrl) {
      try {
        const payload = {
          jobId,
          siteId,
          tenantId,
          timestamp: new Date().toISOString(),
        };

        // Create HMAC signature if secret is configured
        let headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (n8nWebhookSecret) {
          const crypto = await import("crypto");
          const signature = crypto
            .createHmac("sha256", n8nWebhookSecret)
            .update(JSON.stringify(payload))
            .digest("hex");
          headers["X-Signature"] = signature;
        }

        // Fire and forget - don't await
        fetch(n8nWebhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        }).catch((err) => {
          console.error("[factory-generate] n8n webhook failed:", err);
        });
      } catch (webhookError) {
        console.error("[factory-generate] Failed to send n8n webhook:", webhookError);
        // Don't fail the request - webhook is async
      }
    } else {
      console.warn("[factory-generate] N8N_FACTORY_GENERATE_WEBHOOK_URL not configured");
    }

    // Update site status to generating
    await withTenant(tenantId, async (tx) => {
      await tx.site.update({
        where: { id: siteId },
        data: { status: "generating" },
      });
    });

    return NextResponse.json(
      {
        jobId,
        status: "generating",
        message: "Generación iniciada. Te avisamos cuando esté listo para revisión.",
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("[factory-generate] Error:", error);

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