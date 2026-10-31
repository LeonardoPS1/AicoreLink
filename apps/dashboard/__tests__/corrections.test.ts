import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  db: {
    correctionLog: {
      findMany: vi.fn(),
      create: vi.fn(),
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
import { GET, POST } from "@/app/api/tenants/[id]/corrections/route";

function makeReq(url: string, body?: unknown, method = "GET") {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.db.correctionLog.findMany.mockResolvedValue([
    { id: "c1", tenantId: "t1", original: "wrong", correction: "right", context: "test", createdAt: new Date() },
  ]);
  h.db.correctionLog.create.mockImplementation(async (args: any) => ({ id: "c2", ...args.data, createdAt: new Date() }));
});

describe("GET /api/tenants/[id]/corrections", () => {
  it("returns corrections", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/t1/corrections"), { params: Promise.resolve({ id: "t1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });
});

describe("POST /api/tenants/[id]/corrections", () => {
  it("creates a correction", async () => {
    const res = await POST(
      makeReq("http://localhost/api/tenants/t1/corrections", { original: "wrong", correction: "right", context: "test" }, "POST"),
      { params: Promise.resolve({ id: "t1" }) }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.original).toBe("wrong");
    expect(body.correction).toBe("right");
  });
});
