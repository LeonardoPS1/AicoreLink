/**
 * Site approval for the Fábrica de sitios.
 *
 * Moves a site through the human-in-the-loop review gate:
 *   review  --approveSite-->  approved   (eligible for publishing)
 *   review  --rejectSite--->  draft      (back to the editing queue)
 *
 * Multi-tenant isolation is enforced via withTenant(), so RLS filters rows to
 * the caller's tenant even if the explicit ownership check below were wrong.
 */

import { withTenant } from "@/lib/tenant-context";

export interface ApprovalResult {
  id: string;
  status: string;
}

/**
 * Approves a site that is currently in `review`, making it publishable.
 *
 * @param siteId - Site ID
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @param actor - Optional user id recorded for auditing
 * @returns The updated site id + status
 * @throws If the site is missing, owned by another tenant, or not in `review`
 */
export async function approveSite(
  siteId: string,
  tenantId: string,
  actor = "system"
): Promise<ApprovalResult> {
  return withTenant(tenantId, async (tx) => {
    const site = await tx.site.findUnique({
      where: { id: siteId },
      select: { id: true, tenantId: true, status: true },
    });

    if (!site) {
      throw new Error("Site not found");
    }

    if (site.tenantId !== tenantId) {
      throw new Error("Site not owned by tenant");
    }

    if (site.status !== "review") {
      throw new Error("Site status must be 'review'");
    }

    const updated = await tx.site.update({
      where: { id: siteId },
      data: { status: "approved" },
      select: { id: true, status: true },
    });

    console.info("[factory-approval] site approved", { siteId, tenantId, actor });
    return updated;
  });
}

/**
 * Rejects a site that is currently in `review`, sending it back to `draft`.
 *
 * @param siteId - Site ID
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @param reason - Human-readable rejection reason (recorded for the client)
 * @param actor - Optional user id recorded for auditing
 * @returns The updated site id + status + reason
 * @throws If the site is missing, owned by another tenant, or not in `review`
 */
export async function rejectSite(
  siteId: string,
  tenantId: string,
  reason: string,
  actor = "system"
): Promise<ApprovalResult & { reason: string }> {
  return withTenant(tenantId, async (tx) => {
    const site = await tx.site.findUnique({
      where: { id: siteId },
      select: { id: true, tenantId: true, status: true },
    });

    if (!site) {
      throw new Error("Site not found");
    }

    if (site.tenantId !== tenantId) {
      throw new Error("Site not owned by tenant");
    }

    if (site.status !== "review") {
      throw new Error("Site status must be 'review'");
    }

    const updated = await tx.site.update({
      where: { id: siteId },
      data: { status: "draft" },
      select: { id: true, status: true },
    });

    console.info("[factory-approval] site rejected", { siteId, tenantId, actor, reason });
    return { ...updated, reason };
  });
}
