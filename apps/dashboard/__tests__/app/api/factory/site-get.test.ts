import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockTx } = vi.hoisted(() => ({
  mockTx: { site: { findUnique: vi.fn() } },
}));

vi.mock("@/lib/tenant-context", () => ({
  withTenant: vi.fn(async (tenantId: string, fn: (tx: any) => unknown) => {
    if (!tenantId) throw new Error("withTenant() requiere un tenantId valido");
    return fn(mockTx);
  }),
}));

vi.mock("@/lib/db", () => ({ db: {} }));

import { GET } from "@/app/api/factory/sites/[id]/route";

const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const SITE_ID = "22222222-2222-2222-2222-222222222222";

class MockNextRequest {
  url: string;
  private _headers: Map<string, string>;
  constructor(url: string, headers: Record<string, string> = {}) {
    this.url = url;
    this._headers = new Map(Object.entries(headers));
  }
  get headers() {
    return { get: (key: string) => this._headers.get(key) ?? null };
  }
}
(globalThis as any).NextRequest = MockNextRequest;

function makeRequest(headers: Record<string, string> = { "x-tenant-id": TENANT_ID }) {
  return new MockNextRequest("http://localhost/api/factory/sites/" + SITE_ID, headers) as any;
}

function params(id = SITE_ID) {
  return { params: Promise.resolve({ id }) };
}

function dbSite(overrides: Record<string, unknown> = {}) {
  return {
    id: SITE_ID,
    tenantId: TENANT_ID,
    name: "Peluquería Ana",
    subdomain: "peluqueria-ana",
    customDomain: null,
    status: "review",
    template: { name: "Barbería Growth", planTier: "growth" },
    businessProfile: { rubro: "barberia", name: "Peluquería Ana" },
    pages: [
      {
        id: "p1",
        path: "/",
        title: "Inicio",
        content: { blocks: [] },
        meta: {},
        order: 0,
      },
    ],
    versions: [
      {
        id: "v1",
        version: 1,
        changelog: "Versión inicial",
        createdBy: "system",
        createdAt: new Date("2026-10-13T12:00:00.000Z"),
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTx.site.findUnique.mockResolvedValue(dbSite());
});

describe("GET /api/factory/sites/[id]", () => {
  it("returns 401 without a tenant header", async () => {
    const res = await GET(makeRequest({}), params());
    expect(res.status).toBe(401);
  });

  it("returns the site with pages and versions", async () => {
    const res = await GET(makeRequest(), params());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.site.id).toBe(SITE_ID);
    expect(body.site.pages).toHaveLength(1);
    expect(body.site.versions[0]).toMatchObject({
      version: 1,
      createdAt: "2026-10-13T12:00:00.000Z",
    });
  });

  it("returns 404 when the site does not exist", async () => {
    mockTx.site.findUnique.mockResolvedValue(null);
    const res = await GET(makeRequest(), params());
    expect(res.status).toBe(404);
  });

  it("returns 403 when the site belongs to another tenant", async () => {
    mockTx.site.findUnique.mockResolvedValue(dbSite({ tenantId: "other" }));
    const res = await GET(makeRequest(), params());
    expect(res.status).toBe(403);
  });
});
