import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/panel/health", () => ({
  getSystemHealth: vi.fn(async () => ({
    services: [
      { key: "postgres", label: "Postgres", status: "ok", detail: null, checkedAt: "2026-10-14T12:00:00.000Z" },
    ],
    checkedAt: "2026-10-14T12:00:00.000Z",
  })),
}));

import { GET } from "@/app/api/internal/panel/health/route";

const URL = "http://localhost:3000/api/internal/panel/health";

describe("GET /api/internal/panel/health", () => {
  beforeEach(() => {
    process.env.FACTORY_INTERNAL_API_KEY = "internal-secret";
  });

  it("rejects a request with no key", async () => {
    const response = await GET(new Request(URL));
    expect(response.status).toBe(401);
  });

  it("rejects a wrong key", async () => {
    const response = await GET(new Request(URL, { headers: { "x-internal-key": "nope" } }));
    expect(response.status).toBe(401);
  });

  it("returns the health payload for a valid key", async () => {
    const response = await GET(new Request(URL, { headers: { "x-internal-key": "internal-secret" } }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.services[0].key).toBe("postgres");
  });

  it("fails closed when the key is not configured on the server", async () => {
    delete process.env.FACTORY_INTERNAL_API_KEY;
    const response = await GET(new Request(URL, { headers: { "x-internal-key": "anything" } }));
    expect(response.status).toBe(401);
  });
});
