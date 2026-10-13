import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockTx } = vi.hoisted(() => ({
  mockTx: { site: { findMany: vi.fn() } },
}));

vi.mock("@/lib/tenant-context", () => ({
  asAdmin: vi.fn(async (fn: (tx: any) => unknown) => fn(mockTx)),
}));

vi.mock("@/lib/db", () => ({ db: {} }));

import { GET } from "@/app/api/admin/sites/route";

class MockNextRequest {
  url: string;
  constructor(url: string) {
    this.url = url;
  }
}
(globalThis as any).NextRequest = MockNextRequest;

function makeRequest(query = "") {
  return new MockNextRequest("http://localhost/api/admin/sites" + query) as any;
}

function dbSite(overrides: Record<string, unknown> = {}) {
  return {
    id: "site-1",
    name: "Peluquería Ana",
    subdomain: "peluqueria-ana",
    customDomain: null,
    status: "published",
    updatedAt: new Date("2026-10-13T12:00:00.000Z"),
    publishedAt: new Date("2026-10-12T10:00:00.000Z"),
    currentVersionId: "ver-2",
    tenant: { id: "t1", name: "Ana Spa" },
    businessProfile: { rubro: "barberia", name: "Peluquería Ana" },
    template: { planTier: "growth" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTx.site.findMany.mockResolvedValue([dbSite()]);
});

describe("GET /api/admin/sites", () => {
  it("returns a mapped list of sites", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sites).toHaveLength(1);
    expect(body.sites[0]).toMatchObject({
      id: "site-1",
      rubro: "barberia",
      planTier: "growth",
      status: "published",
      publishedAt: "2026-10-12T10:00:00.000Z",
    });
  });

  it("applies status and rubro filters to the query", async () => {
    await GET(makeRequest("?status=review&rubro=clinica"));
    expect(mockTx.site.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "review",
          businessProfile: { rubro: "clinica" },
        }),
      })
    );
  });

  it("builds a case-insensitive search filter", async () => {
    await GET(makeRequest("?q=ana"));
    const call = mockTx.site.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
  });

  it("returns 500 when the query fails", async () => {
    mockTx.site.findMany.mockRejectedValue(new Error("boom"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
