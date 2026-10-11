import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@/lib/db", () => ({ db: { landingLead: { create } } }));

const { POST } = await import("@/app/api/leads/route");

const VALID_BODY = {
  nombre: "Juan Pérez",
  negocio: "Barbería El Corte",
  whatsapp: "+54 9 11 5555 5555",
  rubro: "barberia",
  mensaje: "Pierdo consultas por no contestar a tiempo.",
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
  create.mockResolvedValue({ id: "lead_123" });
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
      },
    });
  });

  it("rejects an invalid payload without touching the database", async () => {
    const response = await POST(
      makeRequest({ nombre: "J", negocio: "", whatsapp: "abc", rubro: "" }),
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
