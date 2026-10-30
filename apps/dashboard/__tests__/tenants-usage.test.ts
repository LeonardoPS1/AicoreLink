import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  tx: {
    tenantUsage: { findMany: vi.fn(), findFirst: vi.fn() },
    tenant: { findUnique: vi.fn() },
  },
  withTenant: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/tenant-context", () => ({
  withTenant: h.withTenant,
}));

vi.mock("@/lib/db", () => ({ db: {} }));

vi.mock("next-auth", () => ({
  getServerSession: h.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/tenants/usage/route";

function makeReq(url: string) {
  return new NextRequest(url, { method: "GET" });
}

function session(role: string, tenantId?: string) {
  return { user: { id: "u1", role, tenantId } };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.withTenant.mockImplementation(async (_t: string, fn: (tx: any) => unknown) => fn(h.tx));
  h.tx.tenantUsage.findMany.mockResolvedValue([
    {
      messagesIn: 10,
      messagesOut: 5,
      tokensUsed: 100,
      costEstimate: 1.5,
      model: "mistral",
      version: "v1",
    },
  ]);
  h.tx.tenant.findUnique.mockResolvedValue({ plan: "starter" });
  h.getServerSession.mockResolvedValue(session("cliente", "t1"));
});

describe("GET /api/tenants/usage", () => {
  it("returns aggregated usage + margin for a period", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/usage?period=2026-10"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.usage.messagesIn).toBe(10);
    expect(body.usage.messagesOut).toBe(5);
    expect(body.usage.tokensUsed).toBe(100);
    expect(body.usage.costEstimate).toBe(1.5);
    expect(body.usage.model).toBe("mistral");
    expect(body.usage.version).toBe("v1");
    expect(body.margin.cost).toBe(1.5);
    expect(body.margin.revenue).toBe(19990);
    expect(body.margin.marginPct).toBeCloseTo(((19990 - 1.5) / 19990) * 100);
    expect(h.withTenant).toHaveBeenCalledWith("t1", expect.any(Function));
  });

  it("uses session tenant when query param mismatch for cliente", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/usage?tenantId=t2"));
    expect(res.status).toBe(200);
    expect(h.withTenant).toHaveBeenCalledWith("t1", expect.any(Function));
  });

  it("dev_aicore can use query tenant", async () => {
    h.getServerSession.mockResolvedValue(session("dev_aicore", "t1"));
    const res = await GET(makeReq("http://localhost/api/tenants/usage?tenantId=t2"));
    expect(res.status).toBe(200);
    expect(h.withTenant).toHaveBeenCalledWith("t2", expect.any(Function));
  });
});