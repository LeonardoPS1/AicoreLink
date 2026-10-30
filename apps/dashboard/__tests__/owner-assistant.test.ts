import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  db: {
    lead: { findMany: vi.fn() },
    appointment: { findMany: vi.fn() },
    tenantUsage: { findMany: vi.fn() },
    correctionLog: { findMany: vi.fn() },
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
import { POST } from "@/app/api/tenants/[id]/owner-assistant/route";

function makeReq(url: string, body?: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.db.lead.findMany.mockResolvedValue([{ id: "l1", name: "Lead1", status: "nuevo", source: "web", tenantId: "t1" }]);
  h.db.appointment.findMany.mockResolvedValue([]);
  h.db.tenantUsage.findMany.mockResolvedValue([]);
  h.db.correctionLog.findMany.mockResolvedValue([
    { id: "c1", original: "wrong", correction: "right", context: "test", tenantId: "t1" },
  ]);
  h.getServerSession.mockResolvedValue({ user: { id: "u1", role: "cliente", tenantId: "t1" } });
});

describe("POST /api/tenants/[id]/owner-assistant", () => {
  it("returns summary with corrections", async () => {
    const res = await POST(makeReq("http://localhost/api/tenants/t1/owner-assistant", { question: "¿Cómo va mi negocio?" }), { params: { id: "t1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.answer).toContain("1 leads recientes");
    expect(body.answer).toContain("1 correcciones de aprendizaje");
    expect(body.context.corrections).toHaveLength(1);
  });

  it("handles no corrections", async () => {
    h.db.correctionLog.findMany.mockResolvedValue([]);
    const res = await POST(makeReq("http://localhost/api/tenants/t1/owner-assistant", { question: "Hola" }), { params: { id: "t1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.answer).toContain("0 correcciones de aprendizaje");
  });
});
