import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  tenant: { findUnique: vi.fn() },
  channelCredential: { findFirst: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ db: h }));

import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "@/app/api/tenants/[id]/google-calendar/route";

function makeReq(url: string, body?: unknown, method = "GET") {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.tenant.findUnique.mockResolvedValue({ id: "t1", name: "Test" });
  h.channelCredential.findFirst.mockResolvedValue(null);
  h.channelCredential.upsert.mockResolvedValue({ id: "cred1" });
  h.channelCredential.deleteMany.mockResolvedValue({ count: 1 });
});

describe("GET /api/tenants/[id]/google-calendar", () => {
  it("returns not connected when no credential", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/t1/google-calendar"), { params: Promise.resolve({ id: "t1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.connected).toBe(false);
  });

  it("returns connected when credential exists", async () => {
    h.channelCredential.findFirst.mockResolvedValue({ externalId: "primary" });
    const res = await GET(makeReq("http://localhost/api/tenants/t1/google-calendar"), { params: Promise.resolve({ id: "t1" }) });
    const body = await res.json();
    expect(body.connected).toBe(true);
    expect(body.calendarId).toBe("primary");
  });

  it("returns 404 for unknown tenant", async () => {
    h.tenant.findUnique.mockResolvedValue(null);
    const res = await GET(makeReq("http://localhost/api/tenants/unknown/google-calendar"), { params: Promise.resolve({ id: "unknown" }) });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/tenants/[id]/google-calendar", () => {
  it("connects with accessToken", async () => {
    const res = await POST(
      makeReq("http://localhost/api/tenants/t1/google-calendar", { accessToken: "token123", calendarId: "primary" }, "POST"),
      { params: Promise.resolve({ id: "t1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("rejects without accessToken", async () => {
    const res = await POST(
      makeReq("http://localhost/api/tenants/t1/google-calendar", {}, "POST"),
      { params: Promise.resolve({ id: "t1" }) }
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tenants/[id]/google-calendar", () => {
  it("disconnects", async () => {
    const res = await DELETE(makeReq("http://localhost/api/tenants/t1/google-calendar"), { params: Promise.resolve({ id: "t1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});