import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { notifyNewLead, type LeadNotification } from "@/lib/leads/notify";
import { verifyWebhookSigning } from "@/lib/webhook";

const WEBHOOK_URL = "https://n8n.aicorebots.com/webhook/landing-leads";

const LEAD: LeadNotification = {
  id: "lead_123",
  name: "Juan Pérez",
  business: "Barbería El Corte",
  whatsapp: "+54 9 11 5555 5555",
  vertical: "barberia",
  message: "Pierdo consultas por no contestar a tiempo.",
  userAgent: "vitest",
  createdAt: new Date("2026-10-11T12:00:00.000Z"),
  consent: true,
};

function clearEnv() {
  delete process.env.N8N_LEADS_WEBHOOK_URL;
  delete process.env.N8N_LEADS_WEBHOOK_SECRET;
}

beforeEach(clearEnv);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearEnv();
});

describe("notifyNewLead", () => {
  it("does nothing when no webhook is configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await notifyNewLead(LEAD);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the lead to n8n with a serialisable timestamp", async () => {
    process.env.N8N_LEADS_WEBHOOK_URL = WEBHOOK_URL;

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await notifyNewLead(LEAD);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(WEBHOOK_URL);
    expect(init.method).toBe("POST");

    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["x-signature"]).toBeUndefined();

    expect(JSON.parse(String(init.body))).toEqual({
      event: "landing.lead.created",
      lead: { ...LEAD, createdAt: "2026-10-11T12:00:00.000Z" },
    });
  });

  it("signs the payload when a secret is configured", async () => {
    process.env.N8N_LEADS_WEBHOOK_URL = WEBHOOK_URL;
    process.env.N8N_LEADS_WEBHOOK_SECRET = "s3cr3t-compartido";

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await notifyNewLead(LEAD);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const signature = (init.headers as Record<string, string>)["x-signature"];

    expect(signature).toBeTruthy();
    expect(verifyWebhookSigning(String(init.body), signature, "s3cr3t-compartido")).toBe(
      true,
    );
  });

  it("swallows a rejected webhook response", async () => {
    process.env.N8N_LEADS_WEBHOOK_URL = WEBHOOK_URL;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyNewLead(LEAD)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("swallows a network failure", async () => {
    process.env.N8N_LEADS_WEBHOOK_URL = WEBHOOK_URL;

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(notifyNewLead(LEAD)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });
});
