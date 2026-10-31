import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  db: {
    tenantBilling: {
      findMany: vi.fn(),
    },
  },
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: h.db }));

vi.mock("next-auth", () => ({
  getServerSession: h.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/tenants/[id]/billing/route";

function makeReq(url: string) {
  return new NextRequest(url);
}

function session(role: string, tenantId?: string) {
  return { user: { id: "u1", role, tenantId } };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.db.tenantBilling.findMany.mockResolvedValue([
    { id: "b1", tenantId: "t1", amount: 10000, currency: "CLP", status: "paid", createdAt: new Date() },
  ]);
  h.getServerSession.mockResolvedValue(session("cliente", "t1"));
});

describe("GET /api/tenants/[id]/billing", () => {
  it("returns billing records", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/t1/billing"), { params: Promise.resolve({ id: "t1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].status).toBe("paid");
  });

  it("returns empty array on no records", async () => {
    h.db.tenantBilling.findMany.mockResolvedValue([]);
    const res = await GET(makeReq("http://localhost/api/tenants/t1/billing"), { params: Promise.resolve({ id: "t1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(0);
  });
});
