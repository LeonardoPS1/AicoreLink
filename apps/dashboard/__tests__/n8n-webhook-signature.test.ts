import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { NextRequest } from "next/server";

const state = vi.hoisted(() => ({
  upsert: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      throw new Error("must not open client");
    }
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    conversation: { upsert: state.upsert },
    message: { create: state.create },
  },
}));

const { POST } = await import("@/app/api/webhooks/n8n/route");

function sign(rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

const secret = "test-secret";
const payload = {
  tenantId: "tenant-1",
  contactRef: "contact-1",
  message: "hola",
  messageId: "msg-1",
  mediaType: "text",
};

describe("n8n webhook signature", () => {
  beforeEach(() => {
    process.env.N8N_WEBHOOK_SECRET = secret;
    state.upsert.mockReset();
    state.create.mockReset();
    state.upsert.mockResolvedValue({});
    state.create.mockResolvedValue({});
  });

  it("returns 401 for invalid signature", async () => {
    const rawBody = JSON.stringify(payload);
    const res = await POST(
      new NextRequest("https://example.com/api/webhooks/n8n", {
        method: "POST",
        headers: { "content-type": "application/json", "x-n8n-signature": "deadbeef" },
        body: rawBody,
      })
    );
    expect(res.status).toBe(401);
    expect(state.create).not.toHaveBeenCalled();
  });

  it("does not throw for signature of different length", async () => {
    const rawBody = JSON.stringify(payload);
    const res = await POST(
      new NextRequest("https://example.com/api/webhooks/n8n", {
        method: "POST",
        headers: { "content-type": "application/json", "x-n8n-signature": "sha256=abc" },
        body: rawBody,
      })
    );
    expect(res.status).toBe(401);
  });

  it("passes for valid signature", async () => {
    const rawBody = JSON.stringify(payload);
    const sig = sign(rawBody, secret);
    const res = await POST(
      new NextRequest("https://example.com/api/webhooks/n8n", {
        method: "POST",
        headers: { "content-type": "application/json", "x-n8n-signature": sig },
        body: rawBody,
      })
    );
    expect(res.status).toBe(200);
  });

  it("accepts sha256= prefix", async () => {
    const rawBody = JSON.stringify(payload);
    const sig = "sha256=" + sign(rawBody, secret);
    const res = await POST(
      new NextRequest("https://example.com/api/webhooks/n8n", {
        method: "POST",
        headers: { "content-type": "application/json", "x-n8n-signature": sig },
        body: rawBody,
      })
    );
    expect(res.status).toBe(200);
  });
});

describe("n8n webhook audio_url", () => {
  beforeEach(() => {
    process.env.N8N_WEBHOOK_SECRET = secret;
    state.upsert.mockReset();
    state.create.mockReset();
    state.upsert.mockResolvedValue({});
    state.create.mockResolvedValue({});
  });

  it("writes audioUrl (not audioId) when audioId present", async () => {
    const audioPayload = { ...payload, mediaType: "audio", audioId: "audio-123" };
    const rawBody = JSON.stringify(audioPayload);
    const sig = sign(rawBody, secret);
    const res = await POST(
      new NextRequest("https://example.com/api/webhooks/n8n", {
        method: "POST",
        headers: { "content-type": "application/json", "x-n8n-signature": sig },
        body: rawBody,
      })
    );
    expect(res.status).toBe(200);
    expect(state.create).toHaveBeenCalled();
    const arg = state.create.mock.calls[0][0];
    expect(arg.data).toHaveProperty("audioUrl", "audio-123");
    expect(arg.data).not.toHaveProperty("audioId");
  });
});
