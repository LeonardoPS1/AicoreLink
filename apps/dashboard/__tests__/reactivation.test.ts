import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  db: {
    reactivationCampaign: {
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
import { GET, POST } from "@/app/api/tenants/[id]/reactivation/route";

function makeReq(url: string, body?: unknown, method = "GET") {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.db.reactivationCampaign.findMany.mockResolvedValue([
    { id: "r1", tenantId: "t1", name: "Campaign 1", audience: "all", message: "Hello", scheduledAt: null, createdAt: new Date() },
  ]);
  h.db.reactivationCampaign.create.mockImplementation(async (args: any) => ({ id: "r2", ...args.data, createdAt: new Date() }));
});

describe("GET /api/tenants/[id]/reactivation", () => {
  it("returns campaigns", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/t1/reactivation"), { params: { id: "t1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });
});

describe("POST /api/tenants/[id]/reactivation", () => {
  it("creates a campaign", async () => {
    const res = await POST(
      makeReq("http://localhost/api/tenants/t1/reactivation", { name: "Campaign 2", audience: "inactive_30", message: "Come back!" }, "POST"),
      { params: { id: "t1" } }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Campaign 2");
  });
});
