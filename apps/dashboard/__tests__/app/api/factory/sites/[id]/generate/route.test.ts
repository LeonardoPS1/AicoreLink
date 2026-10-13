import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/factory/sites/[id]/generate/route";

// Mock NextRequest - declare globally for TypeScript
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

// Replace global NextRequest
globalThis.NextRequest = MockNextRequest;

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

// Mock fetch globally
global.fetch = vi.fn();

const mockTx = {
  site: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

describe("POST /api/factory/sites/[id]/generate", () => {
  const siteId = "site-123";
  const tenantId = "tenant-123";

  const mockSite = {
    id: siteId,
    tenantId,
    businessProfileId: "bp-1",
    templateId: "template-1",
    status: "draft",
    name: "Barbería El Corte",
    subdomain: "barberia-el-corte",
    businessProfile: {
      id: "bp-1",
      rubro: "barberia",
      name: "Barbería El Corte",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({ ok: true });

    mockTx.site.findUnique.mockResolvedValue(mockSite);
    mockTx.site.update.mockResolvedValue({});
  });

  it("returns 202 with jobId on success", async () => {
    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data).toHaveProperty("jobId");
    expect(data.status).toBe("generating");
    expect(data.message).toContain("Generación iniciada");
  });

  it("returns 401 when tenantId header missing", async () => {
    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Authentication required");
  });

  it("returns 404 when site not found", async () => {
    mockTx.site.findUnique.mockResolvedValue(null);

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Site not found");
  });

  it("returns 403 when site belongs to different tenant", async () => {
    mockTx.site.findUnique.mockResolvedValue({
      ...mockSite,
      tenantId: "other-tenant",
    });

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Site not owned by tenant");
  });

  it("returns 400 when site status is not draft", async () => {
    mockTx.site.findUnique.mockResolvedValue({
      ...mockSite,
      status: "review",
    });

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Site status must be 'draft'");
  });

  it("returns 400 when businessProfile not found", async () => {
    mockTx.site.findUnique.mockResolvedValue({
      ...mockSite,
      businessProfile: null,
    });

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("BusinessProfile not found");
  });

  it("calls n8n webhook when URL configured", async () => {
    process.env.N8N_FACTORY_GENERATE_WEBHOOK_URL = "https://n8n.example.com/webhook/factory-generate";

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as any;

    await POST(request, { params: Promise.resolve({ id: siteId }) });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://n8n.example.com/webhook/factory-generate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: expect.stringMatching(/"jobId":"[^"]+"/),
      })
    );

    delete process.env.N8N_FACTORY_GENERATE_WEBHOOK_URL;
  });

  it("includes HMAC signature when secret configured", async () => {
    process.env.N8N_FACTORY_GENERATE_WEBHOOK_URL = "https://n8n.example.com/webhook/factory-generate";
    process.env.N8N_FACTORY_GENERATE_WEBHOOK_SECRET = "test-secret";

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as any;

    await POST(request, { params: Promise.resolve({ id: siteId }) });

    const fetchCall = (global.fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;
    expect(headers["X-Signature"]).toBeDefined();

    delete process.env.N8N_FACTORY_GENERATE_WEBHOOK_URL;
    delete process.env.N8N_FACTORY_GENERATE_WEBHOOK_SECRET;
  });

  it("updates site status to generating", async () => {
    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as any;

    await POST(request, { params: Promise.resolve({ id: siteId }) });

    expect(mockTx.site.update).toHaveBeenCalledWith({
      where: { id: siteId },
      data: { status: "generating" },
    });
  });

  it("returns 400 for invalid request body", async () => {
    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "Content-Type": "application/json" },
      body: JSON.stringify({ invalid: "field" }),
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("does not fail if n8n webhook fails", async () => {
    process.env.N8N_FACTORY_GENERATE_WEBHOOK_URL = "https://n8n.example.com/webhook/factory-generate";
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    const request = new NextRequest(`http://localhost/api/factory/sites/${siteId}/generate`, {
      method: "POST",
      headers: { "x-tenant-id": tenantId, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }) as any;

    const response = await POST(request, { params: Promise.resolve({ id: siteId }) });

    // Should still succeed
    expect(response.status).toBe(202);

    delete process.env.N8N_FACTORY_GENERATE_WEBHOOK_URL;
  });
});