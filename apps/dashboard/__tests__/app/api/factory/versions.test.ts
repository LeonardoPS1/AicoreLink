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

vi.mock("@/lib/factory/versioning", () => ({
  createVersion: vi.fn(),
  getVersions: vi.fn(),
  rollback: vi.fn(),
  diffVersions: vi.fn(),
}));

import { withTenant } from "@/lib/tenant-context";
import { createVersion, getVersions, rollback, diffVersions } from "@/lib/factory/versioning";

// Mock NextRequest
declare global {
  var NextRequest: new (url: string, options: { method: string; headers: Record<string, string>; body?: string }) => {
    url: string;
    method: string;
    headers: Headers;
    body: string;
    json(): Promise<any>;
  };
}

class MockNextRequest {
  url: string;
  method: string;
  headers: Headers;
  body: string;

  constructor(url: string, options: { method: string; headers: Record<string, string>; body?: string }) {
    this.url = url;
    this.method = options.method;
    this.headers = new Headers(options.headers);
    this.body = options.body || "";
  }

  async json() {
    return JSON.parse(this.body || "{}");
  }
}

globalThis.NextRequest = MockNextRequest;

const mockTx = {
  site: {
    findUnique: vi.fn(),
  },
  sitePage: {
    findMany: vi.fn(),
  },
  siteVersion: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
};

describe("API /api/factory/sites/[id]/versions", () => {
  const siteId = "site-123";
  const tenantId = "tenant-123";
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.site.findUnique.mockResolvedValue(mockSite);
  });

  describe("GET /api/factory/sites/[id]/versions", () => {
    it("returns versions list", async () => {
      const { GET } = await import("@/app/api/factory/sites/[id]/versions/route");
      
      (getVersions as any).mockResolvedValue([
        { id: "sv-2", version: 2, changelog: "Edits", createdBy: userId, createdAt: new Date("2024-01-02") },
        { id: "sv-1", version: 1, changelog: "Initial", createdBy: "system", createdAt: new Date("2024-01-01") },
      ]);

      const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions`, {
        method: "GET",
        headers: { "x-tenant-id": tenantId },
      }) as any;

      const response = await GET(request, { params: Promise.resolve({ id: siteId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].version).toBe(2);
      expect(data[1].version).toBe(1);
    });

    it("returns 401 when tenantId missing", async () => {
      const { GET } = await import("@/app/api/factory/sites/[id]/versions/route");

      const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions`, {
        method: "GET",
        headers: {},
      }) as any;

      const response = await GET(request, { params: Promise.resolve({ id: siteId }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Authentication required");
    });

    it("returns 404 when site not found", async () => {
      const { GET } = await import("@/app/api/factory/sites/[id]/versions/route");
      
      mockTx.site.findUnique.mockResolvedValue(null);
      (getVersions as any).mockResolvedValue([]);

      const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions`, {
        method: "GET",
        headers: { "x-tenant-id": tenantId },
      }) as any;

      const response = await GET(request, { params: Promise.resolve({ id: siteId }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Site not found");
    });

    it("returns 403 when site belongs to different tenant", async () => {
      const { GET } = await import("@/app/api/factory/sites/[id]/versions/route");
      
      mockTx.site.findUnique.mockResolvedValue({ ...mockSite, tenantId: "other-tenant" });

      const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions`, {
        method: "GET",
        headers: { "x-tenant-id": tenantId },
      }) as any;

      const response = await GET(request, { params: Promise.resolve({ id: siteId }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Site not owned by tenant");
    });
  });

  describe("POST /api/factory/sites/[id]/versions", () => {
    it("creates new version with changelog", async () => {
      const { POST } = await import("@/app/api/factory/sites/[id]/versions/route");
      
      (createVersion as any).mockResolvedValue({
        id: "sv-2",
        version: 2,
        changelog: "Manual edits",
        createdBy: userId,
        createdAt: new Date(),
      });

      const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions`, {
        method: "POST",
        headers: { "x-tenant-id": tenantId, "x-user-id": userId, "Content-Type": "application/json" },
        body: JSON.stringify({ changelog: "Manual edits" }),
      }) as any;

      const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.version).toBe(2);
      expect(data.changelog).toBe("Manual edits");
      expect(createVersion).toHaveBeenCalledWith(siteId, "Manual edits", userId, tenantId);
    });

    it("returns 401 when tenantId missing", async () => {
      const { POST } = await import("@/app/api/factory/sites/[id]/versions/route");

      const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changelog: "Test" }),
      }) as any;

      const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

      expect(response.status).toBe(401);
    });

    it("returns 400 when changelog missing", async () => {
      const { POST } = await import("@/app/api/factory/sites/[id]/versions/route");

      const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions`, {
        method: "POST",
        headers: { "x-tenant-id": tenantId, "x-user-id": userId, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }) as any;

      const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid request body");
    });

    it("returns 404 when site not found", async () => {
      const { POST } = await import("@/app/api/factory/sites/[id]/versions/route");
      
      mockTx.site.findUnique.mockResolvedValue(null);
      (createVersion as any).mockRejectedValue(new Error("Site not found"));

      const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions`, {
        method: "POST",
        headers: { "x-tenant-id": tenantId, "x-user-id": userId, "Content-Type": "application/json" },
        body: JSON.stringify({ changelog: "Test" }),
      }) as any;

      const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Site not found");
    });
  });
});

describe("API /api/factory/sites/[id]/versions/[version]/rollback", () => {
  const siteId = "site-123";
  const tenantId = "tenant-123";
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.site.findUnique.mockResolvedValue(mockSite);
  });

  it("rolls back to target version", async () => {
    const { POST } = await import("@/app/api/factory/sites/[id]/versions/[version]/rollback/route");
    
    (rollback as any).mockResolvedValue(4);

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions/1/rollback`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "x-user-id": userId },
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId, version: "1" }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.newVersion).toBe(4);
    expect(data.message).toContain("Rollback completado");
    expect(rollback).toHaveBeenCalledWith(siteId, 1, userId, tenantId);
  });

  it("returns 401 when tenantId missing", async () => {
    const { POST } = await import("@/app/api/factory/sites/[id]/versions/[version]/rollback/route");

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions/1/rollback`, {
      method: "POST",
      headers: {},
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId, version: "1" }) });

    expect(response.status).toBe(401);
  });

  it("returns 400 when version is not a number", async () => {
    const { POST } = await import("@/app/api/factory/sites/[id]/versions/[version]/rollback/route");

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions/abc/rollback`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "x-user-id": userId },
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId, version: "abc" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid version number");
  });

  it("returns 404 when version not found", async () => {
    const { POST } = await import("@/app/api/factory/sites/[id]/versions/[version]/rollback/route");
    
    (rollback as any).mockRejectedValue(new Error("Version 999 not found"));

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions/999/rollback`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "x-user-id": userId },
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId, version: "999" }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Version 999 not found");
  });
});

describe("API /api/factory/sites/[id]/versions/[version]/diff/[v2]", () => {
  const siteId = "site-123";
  const tenantId = "tenant-123";

  const mockSite = {
    id: siteId,
    tenantId,
    name: "Barbería El Corte",
    subdomain: "barberia-el-corte",
    status: "review",
    currentVersionId: "sv-1",
    templateId: "template-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.site.findUnique.mockResolvedValue(mockSite);
  });

  it("returns semantic diff between versions", async () => {
    const { GET } = await import("@/app/api/factory/sites/[id]/versions/[version]/diff/[v2]/route");
    
    (diffVersions as any).mockResolvedValue({
      added: [{ pagePath: "/", blockType: "cta", blockIndex: 2 }],
      removed: [],
      modified: [
        { pagePath: "/", blockType: "hero", blockIndex: 0, before: {}, after: {}, changedFields: ["content.headline"] },
      ],
    });

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions/1/diff/2`, {
      method: "GET",
      headers: { "x-tenant-id": tenantId },
    }) as any;

    const response = await GET(request, { params: Promise.resolve({ id: siteId, version: "1", v2: "2" }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.added).toHaveLength(1);
    expect(data.modified).toHaveLength(1);
    expect(diffVersions).toHaveBeenCalledWith(siteId, 1, 2, tenantId);
  });

  it("returns 400 when version numbers invalid", async () => {
    const { GET } = await import("@/app/api/factory/sites/[id]/versions/[version]/diff/[v2]/route");

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/versions/a/diff/b`, {
      method: "GET",
      headers: { "x-tenant-id": tenantId },
    }) as any;

    const response = await GET(request, { params: Promise.resolve({ id: siteId, version: "a", v2: "b" }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid version numbers");
  });
});