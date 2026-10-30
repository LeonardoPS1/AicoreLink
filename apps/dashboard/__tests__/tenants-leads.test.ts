import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  tx: { lead: { findMany: vi.fn(), create: vi.fn() } },
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
import { GET, POST } from "@/app/api/tenants/leads/route";

function makeReq(url: string, body?: unknown, method = "GET") {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function session(role: string, tenantId?: string) {
  return { user: { id: "u1", role, tenantId } };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.withTenant.mockImplementation(async (_t: string, fn: (tx: any) => unknown) => fn(h.tx));
  h.tx.lead.findMany.mockResolvedValue([{ id: "l1", name: "Lead1", tenantId: "t1", status: "nuevo" }]);
  h.tx.lead.create.mockImplementation(async (args: any) => ({ id: "l2", ...args.data, createdAt: new Date() }));
  h.getServerSession.mockResolvedValue(session("cliente", "t1"));
});

describe("GET /api/tenants/leads", () => {
  it("returns leads", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/leads"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.leads).toHaveLength(1);
    expect(h.withTenant).toHaveBeenCalledWith("t1", expect.any(Function));
  });

  it("filters status", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/leads?status=nuevo&limit=10"));
    expect(res.status).toBe(200);
    expect(h.tx.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "nuevo" }, take: 10 }));
  });

  it("uses session tenant when query param mismatch for cliente", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/leads?tenantId=t2"));
    expect(res.status).toBe(200);
    expect(h.withTenant).toHaveBeenCalledWith("t1", expect.any(Function));
  });

  it("dev_aicore can use query tenant", async () => {
    h.getServerSession.mockResolvedValue(session("dev_aicore", "t1"));
    const res = await GET(makeReq("http://localhost/api/tenants/leads?tenantId=t2"));
    expect(res.status).toBe(200);
    expect(h.withTenant).toHaveBeenCalledWith("t2", expect.any(Function));
  });
});

describe("POST /api/tenants/leads", () => {
  it("creates lead", async () => {
    const res = await POST(makeReq("http://localhost/api/tenants/leads", { name: "Juan", source: "web", utmSource: "google" }, "POST"));
    expect(res.status).toBe(201);
    expect(h.tx.lead.create).toHaveBeenCalled();
    const args = h.tx.lead.create.mock.calls[0][0];
    expect(args.data).toMatchObject({ tenantId: "t1", name: "Juan", source: "web", utmSource: "google", status: "nuevo" });
  });
});
