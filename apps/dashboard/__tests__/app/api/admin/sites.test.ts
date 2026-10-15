import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  tx: { site: { findMany: vi.fn() } },
  asAdmin: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/tenant-context", () => ({
  asAdmin: h.asAdmin,
}));

vi.mock("@/lib/db", () => ({ db: {} }));

/**
 * The session guard is the ONLY thing between this cross-tenant listing and the
 * public internet: middleware.ts is a pass-through and a Next.js layout wraps
 * pages, not route handlers, so neither one protects this endpoint.
 */
vi.mock("next-auth", () => ({ getServerSession: h.getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

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

function session(role: string) {
  return { user: { id: "u1", role } };
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
  h.asAdmin.mockImplementation(async (fn: (tx: any) => unknown) => fn(h.tx));
  h.tx.site.findMany.mockResolvedValue([dbSite()]);
  h.getServerSession.mockResolvedValue(session("dev_aicore"));
});

describe("GET /api/admin/sites authorization", () => {
  it("rejects an anonymous caller and never opens the cross-tenant connection", async () => {
    h.getServerSession.mockResolvedValue(null);

    const res = await GET(makeRequest());

    expect(res.status).toBe(403);
    expect(h.asAdmin).not.toHaveBeenCalled();
  });

  it("rejects a client session", async () => {
    h.getServerSession.mockResolvedValue(session("cliente"));

    const res = await GET(makeRequest());

    expect(res.status).toBe(403);
    expect(h.asAdmin).not.toHaveBeenCalled();
  });

  it.each(["operador", "soporte"])("rejects the %s staff role for now", async (role) => {
    h.getServerSession.mockResolvedValue(session(role));

    const res = await GET(makeRequest());

    expect(res.status).toBe(403);
    expect(h.asAdmin).not.toHaveBeenCalled();
  });

  it("serves the list once the session is dev_aicore", async () => {
    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    expect(h.asAdmin).toHaveBeenCalledTimes(1);
  });
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
    expect(h.tx.site.findMany).toHaveBeenCalledWith(
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
    const call = h.tx.site.findMany.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
  });

  it("returns unfiltered stats independent of filters", async () => {
    h.tx.site.findMany
      .mockResolvedValueOnce([dbSite({ status: "review" })])
      .mockResolvedValueOnce([
        dbSite({ status: "review" }),
        dbSite({ status: "published" }),
        dbSite({ status: "draft" }),
        dbSite({ status: "draft" }),
      ]);
    const res = await GET(makeRequest("?status=review"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats).toEqual({ total: 4, review: 1, published: 1, draft: 2 });
  });

  it("returns 500 when the query fails", async () => {
    h.tx.site.findMany.mockRejectedValue(new Error("boom"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
