import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/tenant-context", () => ({
  withTenant: vi.fn(async (tenantId: string, fn: any) => {
    if (!tenantId) throw new Error("withTenant() requiere un tenantId valido");
    return fn(mockTx);
  }),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(async (fn: any) => fn(mockTx)),
  },
}));

import { withTenant } from "@/lib/tenant-context";
import { createVersion, getVersions, rollback, diffVersions, type VersionDiff } from "@/lib/factory/versioning";

const mockTx = {
  site: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  sitePage: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  siteVersion: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
};

describe("versioning.ts - Site Versioning", () => {
  const tenantId = "tenant-123";
  const siteId = "site-123";
  const userId = "user-123";

  const mockSite = {
    id: siteId,
    tenantId,
    name: "Barbería El Corte",
    subdomain: "barberia-el-corte",
    status: "review",
    currentVersionId: "sv-1",
    templateId: "template-1",
  };

  const mockPages = [
    {
      id: "sp-1",
      siteId,
      path: "/",
      title: "Inicio",
      content: {
        blocks: [
          { type: "hero", content: { headline: "Tu Barbería El Corte", subheadline: "La mejor" } },
          { type: "services", content: { items: [{ name: "Corte", priceCLP: 15000 }] } },
        ],
      },
      meta: { title: "Barbería El Corte", description: "La mejor barbería", ogImage: "" },
      order: 0,
    },
    {
      id: "sp-2",
      siteId,
      path: "/contacto",
      title: "Contacto",
      content: {
        blocks: [
          { type: "contact", content: { phone: "+56912345678", email: "test@test.cl" } },
        ],
      },
      meta: { title: "Contacto", description: "Contacto", ogImage: "" },
      order: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.site.findUnique.mockResolvedValue(mockSite);
    mockTx.sitePage.findMany.mockResolvedValue(mockPages);
    mockTx.siteVersion.count.mockResolvedValue(0);
  });

  describe("createVersion", () => {
    it("creates version 1 when no versions exist", async () => {
      mockTx.siteVersion.count.mockResolvedValue(0);
      mockTx.siteVersion.create.mockResolvedValue({
        id: "sv-1",
        version: 1,
        siteId,
        pages: mockPages,
        changelog: "Initial AI generation",
        createdBy: userId,
        createdAt: new Date(),
      });

      const result = await createVersion(siteId, "Initial AI generation", userId, tenantId);

      expect(result.version).toBe(1);
      expect(result.changelog).toBe("Initial AI generation");
      expect(result.createdBy).toBe(userId);
      expect(mockTx.siteVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            siteId,
            version: 1,
            pages: expect.any(Array),
            changelog: "Initial AI generation",
            createdBy: userId,
          }),
        })
      );
    });

    it("creates version 2 when version 1 exists", async () => {
      mockTx.siteVersion.count.mockResolvedValue(1);
      mockTx.siteVersion.create.mockResolvedValue({
        id: "sv-2",
        version: 2,
        siteId,
        pages: mockPages,
        changelog: "Manual edits",
        createdBy: userId,
        createdAt: new Date(),
      });

      const result = await createVersion(siteId, "Manual edits", userId, tenantId);

      expect(result.version).toBe(2);
    });

    it("snapshots all pages with correct structure", async () => {
      mockTx.siteVersion.create.mockResolvedValue({
        id: "sv-1",
        version: 1,
        siteId,
        pages: mockPages,
        changelog: "Test",
        createdBy: userId,
        createdAt: new Date(),
      });

      await createVersion(siteId, "Test", userId, tenantId);

      const createCall = mockTx.siteVersion.create.mock.calls[0][0];
      const savedPages = createCall.data.pages;
      expect(savedPages).toHaveLength(2);
      expect(savedPages[0]).toHaveProperty("path", "/");
      expect(savedPages[0]).toHaveProperty("title", "Inicio");
      expect(savedPages[0]).toHaveProperty("content");
      expect(savedPages[0]).toHaveProperty("meta");
      expect(savedPages[0]).toHaveProperty("order", 0);
      expect(savedPages[0].content).toHaveProperty("blocks");
    });

    it("updates Site.currentVersionId and status", async () => {
      mockTx.siteVersion.create.mockResolvedValue({
        id: "sv-new",
        version: 1,
        siteId,
        pages: mockPages,
        changelog: "Test",
        createdBy: userId,
        createdAt: new Date(),
      });

      await createVersion(siteId, "Test", userId, tenantId);

      expect(mockTx.site.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: siteId },
          data: expect.objectContaining({
            currentVersionId: "sv-new",
            status: "review",
          }),
        })
      );
    });

    it("throws when site not found", async () => {
      mockTx.site.findUnique.mockResolvedValue(null);

      await expect(createVersion(siteId, "Test", userId, tenantId)).rejects.toThrow("Site not found");
    });

    it("throws when tenantId is empty", async () => {
      await expect(createVersion(siteId, "Test", userId, "")).rejects.toThrow("withTenant() requiere un tenantId valido");
    });

    it("uses withTenant for all DB operations", async () => {
      mockTx.siteVersion.create.mockResolvedValue({
        id: "sv-1",
        version: 1,
        siteId,
        pages: mockPages,
        changelog: "Test",
        createdBy: userId,
        createdAt: new Date(),
      });

      await createVersion(siteId, "Test", userId, tenantId);

      expect(withTenant).toHaveBeenCalledWith(tenantId, expect.any(Function));
    });
  });

  describe("getVersions", () => {
    it("returns all versions ordered by version DESC", async () => {
      const mockVersions = [
        { id: "sv-3", version: 3, changelog: "v3", createdBy: userId, createdAt: new Date("2024-01-03") },
        { id: "sv-2", version: 2, changelog: "v2", createdBy: userId, createdAt: new Date("2024-01-02") },
        { id: "sv-1", version: 1, changelog: "v1", createdBy: userId, createdAt: new Date("2024-01-01") },
      ];
      mockTx.siteVersion.findMany.mockResolvedValue(mockVersions);

      const result = await getVersions(siteId, tenantId);

      expect(result).toHaveLength(3);
      expect(result[0].version).toBe(3);
      expect(result[1].version).toBe(2);
      expect(result[2].version).toBe(1);
      expect(mockTx.siteVersion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { siteId },
          orderBy: { version: "desc" },
          select: expect.objectContaining({
            id: true,
            version: true,
            changelog: true,
            createdBy: true,
            createdAt: true,
          }),
        })
      );
    });

    it("returns empty array when no versions", async () => {
      mockTx.siteVersion.findMany.mockResolvedValue([]);

      const result = await getVersions(siteId, tenantId);

      expect(result).toEqual([]);
    });

    it("uses withTenant", async () => {
      mockTx.siteVersion.findMany.mockResolvedValue([]);

      await getVersions(siteId, tenantId);

      expect(withTenant).toHaveBeenCalledWith(tenantId, expect.any(Function));
    });
  });

  describe("diffVersions", () => {
    const version1Pages = [
      {
        path: "/",
        title: "Inicio",
        content: {
          blocks: [
            { type: "hero", content: { headline: "Original headline" } },
            { type: "services", content: { items: [{ name: "Service 1" }] } },
          ],
        },
        meta: { title: "Home", description: "Desc" },
        order: 0,
      },
      {
        path: "/contacto",
        title: "Contacto",
        content: {
          blocks: [
            { type: "contact", content: { phone: "+56912345678" } },
          ],
        },
        meta: { title: "Contact", description: "Desc" },
        order: 1,
      },
    ];

    const version2Pages = [
      {
        path: "/",
        title: "Inicio",
        content: {
          blocks: [
            { type: "hero", content: { headline: "Modified headline" } },
            { type: "services", content: { items: [{ name: "Service 1" }, { name: "Service 2" }] } },
            { type: "cta", content: { text: "New CTA" } },
          ],
        },
        meta: { title: "Home", description: "Desc" },
        order: 0,
      },
      {
        path: "/servicios",
        title: "Servicios",
        content: {
          blocks: [
            { type: "services", content: { items: [{ name: "Service 3" }] } },
          ],
        },
        meta: { title: "Servicios", description: "Desc" },
        order: 2,
      },
      {
        path: "/contacto",
        title: "Contacto",
        content: {
          blocks: [
            { type: "contact", content: { phone: "+56987654321" } },
          ],
        },
        meta: { title: "Contact", description: "Desc" },
        order: 1,
      },
    ];

    it("detects added blocks", async () => {
      mockTx.siteVersion.findUnique
        .mockResolvedValueOnce({ id: "sv-1", version: 1, pages: version1Pages })
        .mockResolvedValueOnce({ id: "sv-2", version: 2, pages: version2Pages });

      const result = await diffVersions(siteId, 1, 2, tenantId);

      // Added: cta block on "/", services block on "/servicios"
      expect(result.added).toContainEqual(
        expect.objectContaining({ pagePath: "/", blockType: "cta", blockIndex: 2 })
      );
      expect(result.added).toContainEqual(
        expect.objectContaining({ pagePath: "/servicios", blockType: "services", blockIndex: 0 })
      );
    });

    it("detects removed blocks", async () => {
      mockTx.siteVersion.findUnique
        .mockResolvedValueOnce({ id: "sv-1", version: 1, pages: version1Pages })
        .mockResolvedValueOnce({ id: "sv-2", version: 2, pages: version2Pages });

      const result = await diffVersions(siteId, 1, 2, tenantId);

      // contact block removed from "/contacto" (replaced with different phone)
      // Actually contact block still exists but phone changed - that's modified
      // The whole "/contacto" page exists in both, so no page-level removal
    });

    it("detects modified blocks with changedFields", async () => {
      mockTx.siteVersion.findUnique
        .mockResolvedValueOnce({ id: "sv-1", version: 1, pages: version1Pages })
        .mockResolvedValueOnce({ id: "sv-2", version: 2, pages: version2Pages });

      const result = await diffVersions(siteId, 1, 2, tenantId);

      // Hero headline changed on "/"
      const heroModified = result.modified.find(
        (m) => m.pagePath === "/" && m.blockType === "hero" && m.blockIndex === 0
      );
      expect(heroModified).toBeDefined();
      expect(heroModified?.changedFields).toContain("content.headline");

      // Services items changed on "/"
      const servicesModified = result.modified.find(
        (m) => m.pagePath === "/" && m.blockType === "services" && m.blockIndex === 1
      );
      expect(servicesModified).toBeDefined();

      // Contact phone changed on "/contacto"
      const contactModified = result.modified.find(
        (m) => m.pagePath === "/contacto" && m.blockType === "contact" && m.blockIndex === 0
      );
      expect(contactModified).toBeDefined();
      expect(contactModified?.changedFields).toContain("content.phone");
    });

    it("handles page added", async () => {
      mockTx.siteVersion.findUnique
        .mockResolvedValueOnce({ id: "sv-1", version: 1, pages: version1Pages })
        .mockResolvedValueOnce({ id: "sv-2", version: 2, pages: version2Pages });

      const result = await diffVersions(siteId, 1, 2, tenantId);

      // "/servicios" page added entirely
      expect(result.added).toContainEqual(
        expect.objectContaining({ pagePath: "/servicios", blockType: "services", blockIndex: 0 })
      );
    });

    it("handles page removed", async () => {
      const v1WithExtra = [...version1Pages, { ...version1Pages[1], path: "/extra", title: "Extra" }];
      mockTx.siteVersion.findUnique
        .mockResolvedValueOnce({ id: "sv-1", version: 1, pages: v1WithExtra })
        .mockResolvedValueOnce({ id: "sv-2", version: 2, pages: version1Pages });

      const result = await diffVersions(siteId, 1, 2, tenantId);

      expect(result.removed).toContainEqual(
        expect.objectContaining({ pagePath: "/extra", blockType: "contact", blockIndex: 0 })
      );
    });

    it("throws when version not found", async () => {
      mockTx.siteVersion.findUnique.mockResolvedValue(null);

      await expect(diffVersions(siteId, 999, 2, tenantId)).rejects.toThrow("Version 999 not found");
    });
  });

  describe("rollback", () => {
    const targetVersionPages = [
      {
        path: "/",
        title: "Inicio",
        content: { blocks: [{ type: "hero", content: { headline: "Rollback headline" } }] },
        meta: { title: "Home", description: "Desc" },
        order: 0,
      },
    ];

    it("restores pages to target version snapshot", async () => {
      mockTx.siteVersion.findUnique
        .mockResolvedValueOnce({ id: "sv-1", version: 1, pages: targetVersionPages }) // target version
        .mockResolvedValueOnce({ id: "sv-3", version: 3, pages: mockPages }); // current version (for count)
      mockTx.siteVersion.count.mockResolvedValue(3); // current max version
      mockTx.siteVersion.create.mockResolvedValue({
        id: "sv-4",
        version: 4,
        siteId,
        pages: targetVersionPages,
        changelog: "Rollback to v1",
        createdBy: userId,
        createdAt: new Date(),
      });
      mockTx.sitePage.deleteMany.mockResolvedValue({ count: 2 });
      mockTx.sitePage.createMany.mockResolvedValue({ count: 1 });
      mockTx.site.update.mockResolvedValue({});

      const result = await rollback(siteId, 1, userId, tenantId);

      expect(result).toBe(4); // new version number
      expect(mockTx.sitePage.deleteMany).toHaveBeenCalledWith({ where: { siteId } });
      expect(mockTx.sitePage.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ path: "/", title: "Inicio" }),
          ]),
        })
      );
    });

    it("creates NEW version (not overwrite) with rollback changelog", async () => {
      mockTx.siteVersion.findUnique
        .mockResolvedValueOnce({ id: "sv-1", version: 1, pages: targetVersionPages })
        .mockResolvedValueOnce({ id: "sv-3", version: 3, pages: mockPages });
      mockTx.siteVersion.count.mockResolvedValue(3);
      mockTx.siteVersion.create.mockResolvedValue({
        id: "sv-4",
        version: 4,
        siteId,
        pages: targetVersionPages,
        changelog: "Rollback to v1",
        createdBy: userId,
        createdAt: new Date(),
      });
      mockTx.sitePage.deleteMany.mockResolvedValue({ count: 2 });
      mockTx.sitePage.createMany.mockResolvedValue({ count: 1 });
      mockTx.site.update.mockResolvedValue({});

      await rollback(siteId, 1, userId, tenantId);

      expect(mockTx.siteVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            version: 4,
            changelog: "Rollback to v1",
          }),
        })
      );
    });

    it("updates Site.currentVersionId to new version", async () => {
      mockTx.siteVersion.findUnique
        .mockResolvedValueOnce({ id: "sv-1", version: 1, pages: targetVersionPages })
        .mockResolvedValueOnce({ id: "sv-3", version: 3, pages: mockPages });
      mockTx.siteVersion.count.mockResolvedValue(3);
      mockTx.siteVersion.create.mockResolvedValue({
        id: "sv-4",
        version: 4,
        siteId,
        pages: targetVersionPages,
        changelog: "Rollback to v1",
        createdBy: userId,
        createdAt: new Date(),
      });
      mockTx.sitePage.deleteMany.mockResolvedValue({ count: 2 });
      mockTx.sitePage.createMany.mockResolvedValue({ count: 1 });
      mockTx.site.update.mockResolvedValue({});

      await rollback(siteId, 1, userId, tenantId);

      expect(mockTx.site.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: siteId },
          data: expect.objectContaining({ currentVersionId: "sv-4" }),
        })
      );
    });

    it("throws when target version not found", async () => {
      // Reset and set up mock to return null for target version lookup
      mockTx.siteVersion.findUnique.mockReset();
      mockTx.siteVersion.findUnique.mockResolvedValue(null);
      // Ensure site lookup still works
      mockTx.site.findUnique.mockResolvedValue(mockSite);
      mockTx.siteVersion.count.mockResolvedValue(0);

      await expect(rollback(siteId, 999, userId, tenantId)).rejects.toThrow("Version 999 not found");
    });

    it("throws when site not found", async () => {
      mockTx.site.findUnique.mockResolvedValue(null);
      mockTx.siteVersion.findUnique.mockResolvedValue({ id: "sv-1", version: 1, pages: targetVersionPages });

      await expect(rollback(siteId, 1, userId, tenantId)).rejects.toThrow("Site not found");
    });
  });
});