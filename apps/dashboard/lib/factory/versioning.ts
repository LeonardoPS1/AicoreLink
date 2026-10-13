/**
 * Site Versioning for Fábrica de sitios.
 *
 * Handles version snapshots, semantic diffs, and rollbacks with
 * multi-tenant isolation via withTenant().
 */

import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";

/**
 * Version diff result - semantic comparison of blocks.
 */
export interface VersionDiff {
  added: Array<{ pagePath: string; blockType: string; blockIndex: number }>;
  removed: Array<{ pagePath: string; blockType: string; blockIndex: number }>;
  modified: Array<{
    pagePath: string;
    blockType: string;
    blockIndex: number;
    before: any;
    after: any;
    changedFields: string[];
  }>;
}

/**
 * Creates a new version snapshot of all site pages.
 *
 * @param siteId - Site ID
 * @param changelog - Description of changes
 * @param userId - User who created the version
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @returns Created SiteVersion with version number
 */
export async function createVersion(
  siteId: string,
  changelog: string,
  userId: string,
  tenantId: string
): Promise<{ id: string; version: number; changelog: string; createdBy: string; createdAt: Date }> {
  return withTenant(tenantId, async (tx) => {
    // 1. Validate site exists and belongs to tenant
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

    // 2. Get all current pages ordered by order
    const pages = await tx.sitePage.findMany({
      where: { siteId },
      orderBy: { order: "asc" },
      select: {
        path: true,
        title: true,
        content: true,
        meta: true,
        order: true,
      },
    });

    if (pages.length === 0) {
      throw new Error("Site has no pages to version");
    }

    // 3. Determine next version number
    const versionCount = await tx.siteVersion.count({ where: { siteId } });
    const nextVersion = versionCount + 1;

    // 4. Create version snapshot
    const siteVersion = await tx.siteVersion.create({
      data: {
        siteId,
        version: nextVersion,
        pages: pages as any,
        changelog,
        createdBy: userId,
      },
      select: {
        id: true,
        version: true,
        changelog: true,
        createdBy: true,
        createdAt: true,
      },
    });

    // 5. Update site status and currentVersionId
    await tx.site.update({
      where: { id: siteId },
      data: {
        status: "review",
        currentVersionId: siteVersion.id,
      },
    });

    // Ensure changelog is string (not null)
    return { ...siteVersion, changelog: siteVersion.changelog ?? "" };
  });
}

/**
 * Gets all versions for a site, ordered by version DESC.
 *
 * @param siteId - Site ID
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @returns Array of versions with metadata
 */
export async function getVersions(
  siteId: string,
  tenantId: string
): Promise<Array<{ id: string; version: number; changelog: string; createdBy: string; createdAt: Date }>> {
  return withTenant(tenantId, async (tx) => {
    const versions = await tx.siteVersion.findMany({
      where: { siteId },
      orderBy: { version: "desc" },
      select: {
        id: true,
        version: true,
        changelog: true,
        createdBy: true,
        createdAt: true,
      },
    });

    // Changelog can be null in DB, convert to empty string for UI
    return versions.map((v) => ({ ...v, changelog: v.changelog ?? "" }));
  });
}

/**
 * Compares two versions semantically by blocks.
 *
 * @param siteId - Site ID
 * @param v1 - First version number (base)
 * @param v2 - Second version number (target)
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @returns Semantic diff with added, removed, modified blocks
 */
export async function diffVersions(siteId: string, v1: number, v2: number, tenantId: string): Promise<VersionDiff> {
  return withTenant(tenantId, async (tx) => {
    // Get both versions
    const [version1, version2] = await Promise.all([
      tx.siteVersion.findUnique({
        where: { siteId_version: { siteId, version: v1 } },
        select: { pages: true },
      }),
      tx.siteVersion.findUnique({
        where: { siteId_version: { siteId, version: v2 } },
        select: { pages: true },
      }),
    ]);

    if (!version1) throw new Error(`Version ${v1} not found`);
    if (!version2) throw new Error(`Version ${v2} not found`);

    const pages1 = version1.pages as Array<{ path: string; title: string; content: { blocks: any[] }; meta: any; order: number }>;
    const pages2 = version2.pages as Array<{ path: string; title: string; content: { blocks: any[] }; meta: any; order: number }>;

    // Index pages by path for comparison
    const pages1ByPath = new Map(pages1.map((p) => [p.path, p]));
    const pages2ByPath = new Map(pages2.map((p) => [p.path, p]));

    const added: VersionDiff["added"] = [];
    const removed: VersionDiff["removed"] = [];
    const modified: VersionDiff["modified"] = [];

    // Check all pages from both versions
    const allPaths = new Set([...pages1ByPath.keys(), ...pages2ByPath.keys()]);

    for (const path of allPaths) {
      const page1 = pages1ByPath.get(path);
      const page2 = pages2ByPath.get(path);

      if (!page1) {
        // Page added in v2
        const blocks2 = page2!.content.blocks;
        for (let i = 0; i < blocks2.length; i++) {
          added.push({ pagePath: path, blockType: blocks2[i].type, blockIndex: i });
        }
        continue;
      }

      if (!page2) {
        // Page removed in v2
        const blocks1 = page1.content.blocks;
        for (let i = 0; i < blocks1.length; i++) {
          removed.push({ pagePath: path, blockType: blocks1[i].type, blockIndex: i });
        }
        continue;
      }

      // Page exists in both - compare blocks
      const blocks1 = page1.content.blocks;
      const blocks2 = page2.content.blocks;

      // Compare by index (blocks are ordered)
      const maxBlocks = Math.max(blocks1.length, blocks2.length);

      for (let i = 0; i < maxBlocks; i++) {
        const block1 = blocks1[i];
        const block2 = blocks2[i];

        if (!block1) {
          // Block added at this index
          added.push({ pagePath: path, blockType: block2!.type, blockIndex: i });
        } else if (!block2) {
          // Block removed at this index
          removed.push({ pagePath: path, blockType: block1.type, blockIndex: i });
        } else if (block1.type !== block2.type) {
          // Block type changed - treat as remove + add
          removed.push({ pagePath: path, blockType: block1.type, blockIndex: i });
          added.push({ pagePath: path, blockType: block2.type, blockIndex: i });
        } else {
          // Same block type - check content changes
          const changedFields = getChangedFields({ content: block1.content }, { content: block2.content }, "");
          if (changedFields.length > 0) {
            modified.push({
              pagePath: path,
              blockType: block1.type,
              blockIndex: i,
              before: block1.content,
              after: block2.content,
              changedFields,
            });
          }
        }
      }
    }

    return { added, removed, modified };
  });
}

/**
 * Recursively finds changed fields between two objects.
 */
function getChangedFields(obj1: any, obj2: any, prefix: string): string[] {
  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];

    if (val1 === undefined && val2 !== undefined) {
      changes.push(path);
    } else if (val1 !== undefined && val2 === undefined) {
      changes.push(path);
    } else if (typeof val1 === "object" && typeof val2 === "object" && val1 !== null && val2 !== null) {
      // Recurse for nested objects
      if (Array.isArray(val1) && Array.isArray(val2)) {
        // For arrays, compare length and items
        if (val1.length !== val2.length) {
          changes.push(path);
        } else {
          for (let i = 0; i < val1.length; i++) {
            const itemChanges = getChangedFields(val1[i], val2[i], `${path}[${i}]`);
            changes.push(...itemChanges);
          }
        }
      } else {
        const nestedChanges = getChangedFields(val1, val2, path);
        changes.push(...nestedChanges);
      }
    } else if (val1 !== val2) {
      // Ensure we include the full path including 'content.' prefix if it's a direct property
      changes.push(path);
    }
  }

  return changes;
}

/**
 * Rolls back a site to a target version.
 *
 * Creates a NEW version (does not overwrite history) with the target version's content.
 *
 * @param siteId - Site ID
 * @param targetVersion - Version number to rollback to
 * @param userId - User performing the rollback
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @returns New version number created
 */
export async function rollback(siteId: string, targetVersion: number, userId: string, tenantId: string): Promise<number> {
  return withTenant(tenantId, async (tx) => {
    // 1. Get target version snapshot
    const targetVersionRecord = await tx.siteVersion.findUnique({
      where: { siteId_version: { siteId, version: targetVersion } },
      select: { id: true, pages: true },
    });

    if (!targetVersionRecord) {
      throw new Error(`Version ${targetVersion} not found`);
    }

    if (targetVersionRecord.pages === null) {
      throw new Error(`Version ${targetVersion} has no pages`);
    }

    // 2. Validate site exists and belongs to tenant
    const site = await tx.site.findUnique({
      where: { id: siteId },
      select: { id: true, tenantId: true, currentVersionId: true },
    });

    if (!site) {
      throw new Error("Site not found");
    }

    if (site.tenantId !== tenantId) {
      throw new Error("Site not owned by tenant");
    }

    // 3. Get current max version number
    const versionCount = await tx.siteVersion.count({ where: { siteId } });
    const newVersion = versionCount + 1;

    // 4. Delete current pages
    await tx.sitePage.deleteMany({ where: { siteId } });

    // 5. Restore pages from target version
    const pagesToRestore = targetVersionRecord.pages as Array<{
      path: string;
      title: string;
      content: any;
      meta: any;
      order: number;
    }>;

    await tx.sitePage.createMany({
      data: pagesToRestore.map((p) => ({
        siteId,
        path: p.path,
        title: p.title,
        content: p.content,
        meta: p.meta,
        order: p.order,
      })),
    });

    // 6. Create new version with rollback changelog
    const newVersionRecord = await tx.siteVersion.create({
      data: {
        siteId,
        version: newVersion,
        pages: targetVersionRecord.pages,
        changelog: `Rollback to v${targetVersion}`,
        createdBy: userId,
      },
      select: { id: true, version: true },
    });

    // 7. Update site currentVersionId
    await tx.site.update({
      where: { id: siteId },
      data: { currentVersionId: newVersionRecord.id },
    });

    return newVersion;
  });
}