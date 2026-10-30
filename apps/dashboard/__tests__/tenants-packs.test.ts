import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  tenant: { findUnique: vi.fn() },
}));

vi.mock("@/lib/db", () => ({ db: h }));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/tenants/[id]/packs/route";

function makeReq(url: string) {
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.tenant.findUnique.mockResolvedValue({
    id: "t1",
    businessProfiles: [{ rubro: "clinica" }],
  });
});

describe("GET /api/tenants/[id]/packs", () => {
  it("returns packs for clinica rubro", async () => {
    const res = await GET(makeReq("http://localhost/api/tenants/t1/packs"), { params: { id: "t1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.rubro).toBe("clinica");
    expect(body.packs).toHaveLength(3);
    expect(body.packs[0].name).toBe("Pack Básico");
  });

  it("defaults to clinica when no business profile", async () => {
    h.tenant.findUnique.mockResolvedValue({ id: "t1", businessProfiles: [] });
    const res = await GET(makeReq("http://localhost/api/tenants/t1/packs"), { params: { id: "t1" } });
    const body = await res.json();
    expect(body.rubro).toBe("clinica");
  });

  it("returns gimnasio packs", async () => {
    h.tenant.findUnique.mockResolvedValue({
      id: "t2",
      businessProfiles: [{ rubro: "gimnasio" }],
    });
    const res = await GET(makeReq("http://localhost/api/tenants/t2/packs"), { params: { id: "t2" } });
    const body = await res.json();
    expect(body.rubro).toBe("gimnasio");
    expect(body.packs[0].services).toContain("Reservas de clases");
  });
});