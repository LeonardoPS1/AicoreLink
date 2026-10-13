import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { create, notifyNewLead } = vi.hoisted(() => ({
  create: vi.fn(),
  notifyNewLead: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db: { landingLead: { create } } }));
vi.mock("@/lib/leads/notify", () => ({ notifyNewLead }));

const { POST } = await import("@/app/api/leads/route");

const VALID_BODY = {
  nombre: "Juan Pérez",
  negocio: "Barbería El Corte",
  whatsapp: "+56 9 5555 5555",
  rubro: "barberia",
  mensaje: "Pierdo consultas por no contestar a tiempo.",
  utm: {
    source: "google",
    medium: "cpc",
    campaign: "verano_2026",
    content: "anuncio_1",
    term: "sitio web barberia",
  },
  consent: true,
};

let ip = 0;

function makeRequest(
  body: unknown,
  options: { url?: string; rawBody?: string; headers?: Record<string, string> } = {}
) {
  ip += 1;

  return new NextRequest(
    options.url ?? "https://aicorelink.aicorebots.com/api/leads?utm_source=query_source&utm_medium=query_medium",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `10.0.0.${ip}`,
        "user-agent": "vitest",
        "referer": "https://aicorelink.aicorebots.com/?utm_source=referer_source&utm_medium=referer_medium",
        ...options.headers,
      },
      body: options.rawBody ?? JSON.stringify(body),
    }
  );
}

beforeEach(() => {
  create.mockReset();
  create.mockResolvedValue({ id: "lead_123", createdAt: new Date("2026-10-12T12:00:00.000Z") });
  notifyNewLead.mockReset();
  notifyNewLead.mockResolvedValue(undefined);
});

describe("POST /api/leads", () => {
  it("rejects when consent is missing or false with 400", async () => {
    const { consent, ...withoutConsent } = VALID_BODY;
    const response = await POST(makeRequest(withoutConsent));

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();

    const body = (await response.json()) as { ok: boolean; fields: Record<string, string[]> };
    expect(body.ok).toBe(false);
    expect(body.fields).toHaveProperty("consent");
  });

  it("persists UTM from body (body overrides query/referer) and consent", async () => {
    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(201);

    expect(create).toHaveBeenCalledTimes(1);
    const createCall = create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createCall.data).toMatchObject({
      name: "Juan Pérez",
      business: "Barbería El Corte",
      whatsapp: "+56 9 5555 5555",
      vertical: "barberia",
      message: "Pierdo consultas por no contestar a tiempo.",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "verano_2026",
      utmContent: "anuncio_1",
      utmTerm: "sitio web barberia",
      consent: true,
    });
  });

  it("falls back to referer/query UTM when body omits utm", async () => {
    const { utm, ...bodyWithoutUtm } = VALID_BODY;
    const response = await POST(makeRequest(bodyWithoutUtm));

    expect(response.status).toBe(201);

    expect(create).toHaveBeenCalledTimes(1);
    const createCall = create.mock.calls[0][0] as { data: Record<string, unknown> };
    // Body has no utm, so referer/query should be used
    expect(createCall.data.utmSource).toBe("referer_source"); // referer wins over query for source
    expect(createCall.data.utmMedium).toBe("referer_medium"); // referer wins over query for medium
    // Query params from URL only have source/medium, so campaign/content/term are null
    expect(createCall.data.utmCampaign).toBeNull();
    expect(createCall.data.utmContent).toBeNull();
    expect(createCall.data.utmTerm).toBeNull();
    expect(createCall.data.consent).toBe(true);
  });

  it("rate limit still works with new schema", async () => {
    const request = () =>
      new NextRequest("https://aicorelink.aicorebots.com/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
        body: JSON.stringify(VALID_BODY),
      });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await POST(request())).status).toBe(201);
    }

    const throttled = await POST(request());

    expect(throttled.status).toBe(429);
    expect(throttled.headers.get("Retry-After")).toBeTruthy();
    expect(create).toHaveBeenCalledTimes(5);
  });

  it("notifyNewLead receives UTM and consent", async () => {
    await POST(makeRequest(VALID_BODY));

    expect(notifyNewLead).toHaveBeenCalledTimes(1);
    const notifyCall = notifyNewLead.mock.calls[0][0];
    expect(notifyCall).toMatchObject({
      id: "lead_123",
      name: "Juan Pérez",
      business: "Barbería El Corte",
      vertical: "barberia",
      utm: {
        source: "google",
        medium: "cpc",
        campaign: "verano_2026",
        content: "anuncio_1",
        term: "sitio web barberia",
      },
      consent: true,
    });
  });
});