import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("@/lib/webhook", () => ({
  generateWebhookSignature: vi.fn(() => "signature"),
}));

import { POST } from "@/app/api/factory/sites/[id]/publish/route";

declare global {
  var NextRequest: new (
    url: string,
    options: { method: string; headers: Record<string, string>; body?: string }
  ) => {
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

  constructor(
    url: string,
    options: { method: string; headers: Record<string, string>; body?: string }
  ) {
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
  siteVersion: {
    findUnique: vi.fn(),
  },
};

const siteId = "22222222-2222-2222-2222-222222222222";
const tenantId = "11111111-1111-1111-1111-111111111111";

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new MockNextRequest("http://localhost/api/factory/sites/x/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-tenant-id": tenantId, ...headers },
    body: JSON.stringify(body),
  }) as any;
}

function params() {
  return { params: Promise.resolve({ id: siteId }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTx.site.findUnique.mockResolvedValue({
    id: siteId,
    tenantId,
    status: "approved",
  });
  mockTx.siteVersion.findUnique.mockResolvedValue({ id: "ver-1" });
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  delete process.env.N8N_FACTORY_PUBLISH_WEBHOOK_URL;
  delete process.env.N8N_FACTORY_PUBLISH_WEBHOOK_SECRET;
});

describe("POST /api/factory/sites/[id]/publish", () => {
  it("returns 401 without a tenant header", async () => {
    const request = makeRequest(
      { version: 1, target: "subdomain" },
      { "x-tenant-id": "" }
    );
    const response = await POST(request, params());
    expect(response.status).toBe(401);
  });

  it("returns 400 for an invalid body", async () => {
    const response = await POST(makeRequest({ target: "subdomain" }), params());
    expect(response.status).toBe(400);
  });

  it("returns 400 when custom target lacks a customDomain", async () => {
    const response = await POST(makeRequest({ version: 1, target: "custom" }), params());
    expect(response.status).toBe(400);
  });

  it("returns 404 when the site is not found", async () => {
    mockTx.site.findUnique.mockResolvedValue(null);
    const response = await POST(makeRequest({ version: 1, target: "subdomain" }), params());
    expect(response.status).toBe(404);
  });

  it("returns 403 when the site belongs to another tenant", async () => {
    mockTx.site.findUnique.mockResolvedValue({ id: siteId, tenantId: "other", status: "approved" });
    const response = await POST(makeRequest({ version: 1, target: "subdomain" }), params());
    expect(response.status).toBe(403);
  });

  it("returns 400 when the site is not approved", async () => {
    mockTx.site.findUnique.mockResolvedValue({ id: siteId, tenantId, status: "draft" });
    const response = await POST(makeRequest({ version: 1, target: "subdomain" }), params());
    expect(response.status).toBe(400);
  });

  it("returns 400 when the version does not exist", async () => {
    mockTx.siteVersion.findUnique.mockResolvedValue(null);
    const response = await POST(makeRequest({ version: 5, target: "subdomain" }), params());
    expect(response.status).toBe(400);
  });

  it("enqueues a publish job with 202", async () => {
    const response = await POST(makeRequest({ version: 1, target: "subdomain" }), params());
    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.status).toBe("publishing");
    expect(typeof body.jobId).toBe("string");
    expect(body.jobId.length).toBeGreaterThan(10);
  });

  it("dispatches the n8n webhook when configured", async () => {
    process.env.N8N_FACTORY_PUBLISH_WEBHOOK_URL = "https://n8n.example/webhook/factory-publish";
    process.env.N8N_FACTORY_PUBLISH_WEBHOOK_SECRET = "secret";

    const response = await POST(makeRequest({ version: 1, target: "subdomain" }), params());
    expect(response.status).toBe(202);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://n8n.example/webhook/factory-publish",
      expect.objectContaining({ method: "POST" })
    );
  });
});
