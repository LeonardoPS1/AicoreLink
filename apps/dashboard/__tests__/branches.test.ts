import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  db: {
    branch: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
import { GET, POST } from "@/app/api/tenants/[id]/branches/route";
import { PATCH, DELETE } from "@/app/api/tenants/[id]/branches/[branchId]/route";

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
  h.db.branch.findMany.mockResolvedValue([
    { id: "b1", tenantId: "t1", name: "Sede 1", address: "Addr 1", phone: "123", active: true },
  ]);
  h.db.branch.create.mockImplementation(async (args: any) => ({ id: "b2", ...args.data }));
  h.db.branch.update.mockImplementation(async (args: any) => ({ id: args.where.id, ...args.data }));
  h.db.branch.delete.mockResolvedValue({ id: "b1" });
  h.getServerSession.mockResolvedValue(session("cliente", "t1"));
});

describe("GET /api/tenants/[id]/branches", () => {
  it("returns branches", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/t1/branches"), { params: { id: "t1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });
});

describe("POST /api/tenants/[id]/branches", () => {
  it("creates a branch", async () => {
    const res = await POST(
      makeReq("http://localhost/api/tenants/t1/branches", { name: "Sede 2", address: "Addr 2", phone: "456" }, "POST"),
      { params: { id: "t1" } }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Sede 2");
  });
});

describe("PATCH /api/tenants/[id]/branches/[branchId]", () => {
  it("updates a branch", async () => {
    const res = await PATCH(
      makeReq("http://localhost/api/tenants/t1/branches/b1", { active: false }, "PATCH"),
      { params: { id: "t1", branchId: "b1" } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.active).toBe(false);
  });
});

describe("DELETE /api/tenants/[id]/branches/[branchId]", () => {
  it("deletes a branch", async () => {
    const res = await DELETE(
      makeReq("http://localhost/api/tenants/t1/branches/b1", undefined, "DELETE"),
      { params: { id: "t1", branchId: "b1" } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
