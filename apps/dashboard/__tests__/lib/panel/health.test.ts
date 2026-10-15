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

  it("reports sin_datos for the local AI when OLLAMA_BASE_URL is not configured", async () => {
    delete process.env.OLLAMA_BASE_URL;
    let probed = false;
    const health = await getSystemHealth({
      ...offlineDeps(),
      fetchFn: (async () => {
        probed = true;
        return jsonResponse(200);
      }) as unknown as typeof fetch,
    });
    const ollama = health.services.find((s) => s.key === "ollama");
    expect(ollama?.status).toBe("sin_datos");
    expect(ollama?.detail).toMatch(/OLLAMA_BASE_URL/);
    // No guessed host is contacted: probing one would report caido/ok for an
    // integration that was never configured.
    expect(probed).toBe(false);
  });

  it("gives up on a hanging database probe instead of hanging the whole menu", async () => {
    const health = await getSystemHealth({
      ...offlineDeps(),
      probeTimeoutMs: 20,
      pingPostgres: () => new Promise<number>(() => {}),
    });
    const postgres = health.services.find((s) => s.key === "postgres");
    expect(postgres?.status).toBe("caido");
    expect(postgres?.detail).toMatch(/no respondió/);
  });

  it("gives up on a hanging publication lookup too", async () => {
    const health = await getSystemHealth({
      ...offlineDeps(),
      probeTimeoutMs: 20,
      lastPublishFailure: () => new Promise<Date | null>(() => {}),
    });
    expect(health.services.find((s) => s.key === "sitePublishing")?.status).toBe("caido");
  });

  it("only calls a publish failure fresh inside the shared 24h window", async () => {
    const fresh = await getSystemHealth({
      ...offlineDeps(),
      lastPublishFailure: async () => new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
    });
    expect(fresh.services.find((s) => s.key === "sitePublishing")?.status).toBe("degradado");

    const stale = await getSystemHealth({
      ...offlineDeps(),
      lastPublishFailure: async () => new Date(NOW.getTime() - 30 * 60 * 60 * 1000),
    });
    expect(stale.services.find((s) => s.key === "sitePublishing")?.status).toBe("ok");
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
