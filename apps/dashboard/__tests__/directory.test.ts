import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  tenant: { findMany: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ db: h }));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/directory/route";

function makeReq(url: string) {
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.tenant.findMany.mockResolvedValue([
    {
      id: "t1",
      name: "Clinica Demo",
      slug: "clinica-demo",
      status: "activo",
      createdAt: new Date(),
      businessProfiles: [{ rubro: "clinica", address: "santiago", description: "Clinica de prueba" }],
      testimonials: [{ rating: 5 }, { rating: 4 }],
    },
  ]);
});

describe("GET /api/directory", () => {
  it("returns directory entries", async () => {
    const res = await GET(makeReq("http://localhost/api/directory"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.directory).toHaveLength(1);
    expect(body.directory[0].name).toBe("Clinica Demo");
    expect(body.directory[0].rating).toBe(4.5);
  });

  it("filters by rubro", async () => {
    const res = await GET(makeReq("http://localhost/api/directory?rubro=clinica"));
    const body = await res.json();
    expect(body.directory).toHaveLength(1);
  });

  it("returns empty for non-matching rubro", async () => {
    const res = await GET(makeReq("http://localhost/api/directory?rubro=gimnasio"));
    const body = await res.json();
    expect(body.directory).toHaveLength(0);
  });
});