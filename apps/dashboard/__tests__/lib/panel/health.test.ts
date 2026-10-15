import { describe, expect, it } from "vitest";
import { getSystemHealth } from "@/lib/panel/health";

const NOW = new Date("2026-10-14T12:00:00.000Z");

function jsonResponse(status: number) {
  return new Response("{}", { status });
}

// Every probe that would reach a real dependency is injected in every test:
// the defaults load the Prisma client and hit the network, which makes a unit
// suite slow and non-deterministic.
function offlineDeps() {
  return {
    now: () => NOW,
    pingPostgres: async () => 12,
    fetchFn: (async () => jsonResponse(200)) as unknown as typeof fetch,
    lastPublishFailure: async () => null,
  };
}

describe("getSystemHealth()", () => {
  it("reports ok for a service that answers 200 quickly", async () => {
    const health = await getSystemHealth(offlineDeps());
    const postgres = health.services.find((s) => s.key === "postgres");
    expect(postgres?.status).toBe("ok");
    expect(postgres?.checkedAt).toBe(NOW.toISOString());
  });

  it("reports sin_datos (never caido) when a service URL is not configured", async () => {
    delete process.env.CHATWOOT_BASE_URL;
    const health = await getSystemHealth({ ...offlineDeps(), pingPostgres: async () => 5 });
    const whatsapp = health.services.find((s) => s.key === "whatsapp");
    expect(whatsapp?.status).toBe("sin_datos");
    expect(whatsapp?.detail).toMatch(/CHATWOOT_BASE_URL/);
  });

  it("reports caido when the probe throws", async () => {
    process.env.N8N_BASE_URL = "http://n8n.invalid:5678";
    try {
      const health = await getSystemHealth({
        ...offlineDeps(),
        pingPostgres: async () => 5,
        fetchFn: (async () => { throw new Error("ECONNREFUSED"); }) as unknown as typeof fetch,
      });
      expect(health.services.find((s) => s.key === "n8n")?.status).toBe("caido");
    } finally {
      delete process.env.N8N_BASE_URL;
    }
  });

  it("reports degradado when Postgres answers but slowly", async () => {
    const health = await getSystemHealth({ ...offlineDeps(), pingPostgres: async () => 2500 });
    expect(health.services.find((s) => s.key === "postgres")?.status).toBe("degradado");
  });

  it("always returns the five design services in order", async () => {
    const health = await getSystemHealth({ ...offlineDeps(), pingPostgres: async () => 10 });
    expect(health.services.map((s) => s.key)).toEqual([
      "postgres", "n8n", "ollama", "whatsapp", "sitePublishing",
    ]);
  });
});
