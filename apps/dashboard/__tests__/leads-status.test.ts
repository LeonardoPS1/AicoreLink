import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  tx: { lead: { update: vi.fn() } },
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
import { PATCH } from "@/app/api/tenants/[id]/leads/[leadId]/status/route";

function makeReq(url: string, body?: unknown, method = "PATCH") {
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
  h.tx.lead.update.mockImplementation(async (args: any) => ({ id: "l1", ...args.data }));
  h.getServerSession.mockResolvedValue(session("cliente", "t1"));
});

describe("PATCH /api/tenants/[id]/leads/[leadId]/status", () => {
  it("updates lead status", async () => {
    const res = await PATCH(
      makeReq("http://localhost/api/tenants/t1/leads/l1/status", { status: "contactado" }),
      { params: Promise.resolve({ id: "t1", leadId: "l1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(h.tx.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "l1" }, data: { status: "contactado" } })
    );
  });

  it("rejects invalid body", async () => {
    const res = await PATCH(
      makeReq("http://localhost/api/tenants/t1/leads/l1/status", {}),
      { params: Promise.resolve({ id: "t1", leadId: "l1" }) }
    );
    expect(res.status).toBe(400);
  });

  it("rejects unauthorized", async () => {
    h.getServerSession.mockResolvedValue(null);
    const res = await PATCH(
      makeReq("http://localhost/api/tenants/t1/leads/l1/status", { status: "contactado" }),
      { params: Promise.resolve({ id: "t1", leadId: "l1" }) }
    );
    expect(res.status).toBe(403);
  });
});
