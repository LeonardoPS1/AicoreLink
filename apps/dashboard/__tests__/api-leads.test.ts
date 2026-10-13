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
  whatsapp: "+54 9 11 5555 5555",
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

function makeRequest(body: unknown, rawBody?: string) {
  ip += 1;

  return new NextRequest("https://aicorelink.aicorebots.com/api/leads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": `10.0.0.${ip}`,
      "user-agent": "vitest",
    },
    body: rawBody ?? JSON.stringify(body),
  });
}

beforeEach(() => {
  create.mockReset();
  create.mockResolvedValue({ id: "lead_123", createdAt: new Date("2026-10-11T12:00:00.000Z") });
  notifyNewLead.mockReset();
  notifyNewLead.mockResolvedValue(undefined);
});

describe("POST /api/leads", () => {
  it("persists a valid lead and returns 201", async () => {
    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true, id: "lead_123" });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toMatchObject({
      data: {
        name: "Juan Pérez",
        business: "Barbería El Corte",
        whatsapp: "+54 9 11 5555 5555",
        vertical: "barberia",
        message: "Pierdo consultas por no contestar a tiempo.",
        userAgent: "vitest",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "verano_2026",
        utmContent: "anuncio_1",
        utmTerm: "sitio web barberia",
        consent: true,
      },
    });
  });

  it("notifies the team after the lead is stored", async () => {
    await POST(makeRequest(VALID_BODY));

    expect(notifyNewLead).toHaveBeenCalledTimes(1);
    expect(notifyNewLead.mock.calls[0][0]).toMatchObject({
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

  it("still returns 201 when the notification fails", async () => {
    notifyNewLead.mockImplementation(() => Promise.reject(new Error("n8n down")));

    const response = await POST(makeRequest(VALID_BODY));

    expect(response.status).toBe(201);
  });

  it("rejects an invalid payload without touching the database", async () => {
    const response = await POST(
      makeRequest({ nombre: "J", negocio: "", whatsapp: "abc", rubro: "", consent: true }),
    );

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();

    const body = (await response.json()) as {
      ok: boolean;
      fields: Record<string, string[]>;
    };

    expect(body.ok).toBe(false);
    expect(body.fields).toHaveProperty("nombre");
    expect(body.fields).toHaveProperty("negocio");
    expect(body.fields).toHaveProperty("whatsapp");
    expect(body.fields).toHaveProperty("rubro");
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(makeRequest(null, "<html>not json</html>"));

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("stores an omitted message as null", async () => {
    const { mensaje, ...withoutMessage } = VALID_BODY;

    await POST(makeRequest(withoutMessage));

    expect(create.mock.calls[0][0]).toMatchObject({ data: { message: null } });
  });

  it("throttles repeated submissions from the same IP", async () => {
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
});
