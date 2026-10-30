import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  tx: { appointment: { findMany: vi.fn(), create: vi.fn() } },
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
import { GET, POST } from "@/app/api/tenants/appointments/route";

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
  h.tx.appointment.findMany.mockResolvedValue([{ id: "a1", scheduledAt: "2026-10-15T10:00:00.000Z", tenantId: "t1", status: "pendiente" }]);
  h.tx.appointment.create.mockImplementation(async (args: any) => ({ id: "a2", ...args.data, createdAt: new Date() }));
  h.getServerSession.mockResolvedValue(session("cliente", "t1"));
});

describe("GET /api/tenants/appointments", () => {
  it("returns appointments", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/appointments"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.appointments).toHaveLength(1);
    expect(h.withTenant).toHaveBeenCalledWith("t1", expect.any(Function));
  });

  it("filters date range", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/appointments?from=2026-01-01&to=2026-01-31"));
    expect(res.status).toBe(200);
    expect(h.tx.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { scheduledAt: { gte: new Date("2026-01-01"), lte: new Date("2026-01-31") } }, take: 50 }));
  });

  it("uses session tenant when query param mismatch for cliente", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/appointments?tenantId=t2"));
    expect(res.status).toBe(200);
    expect(h.withTenant).toHaveBeenCalledWith("t1", expect.any(Function));
  });

  it("dev_aicore can use query tenant", async () => {
    h.getServerSession.mockResolvedValue(session("dev_aicore", "t1"));
    const res = await GET(makeReq("http://localhost/api/tenants/appointments?tenantId=t2"));
    expect(res.status).toBe(200);
    expect(h.withTenant).toHaveBeenCalledWith("t2", expect.any(Function));
  });
});

describe("POST /api/tenants/appointments", () => {
  it("creates appointment", async () => {
    const res = await POST(makeReq("http://localhost/api/tenants/appointments", { scheduledAt: "2026-10-15T10:00:00.000Z", notes: "nota" }, "POST"));
    expect(res.status).toBe(201);
    expect(h.tx.appointment.create).toHaveBeenCalled();
    const args = h.tx.appointment.create.mock.calls[0][0];
    expect(args.data).toMatchObject({ tenantId: "t1", scheduledAt: "2026-10-15T10:00:00.000Z", status: "pendiente", notes: "nota" });
  });
});