import { withTenant } from "./tenant-context";

/**
 * Display name of a tenant, read under the row level security policy of that
 * same tenant. Returns null when the row is not visible instead of inventing a
 * name; the shell already has a neutral fallback.
 */
export async function getTenantName(tenantId: string): Promise<string | null> {
  if (!tenantId) return null;

  const tenant = await withTenant(tenantId, (tx) =>
    tx.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
  );

  return tenant?.name ?? null;
}
