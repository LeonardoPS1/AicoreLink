import { beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { NextRequest } from "next/server";

const state = vi.hoisted(() => ({
  verify: vi.fn(),
  parse: vi.fn(),
  resolve: vi.fn(),
  mirror: vi.fn(),
  send: vi.fn(),
  txConvFindFirst: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      throw new Error("must not open client");
    }
  },
}));

vi.mock("@/lib/chatwoot/signature", () => ({
  verifyChatwootSignature: state.verify,
  parseChatwootWebhook: state.parse,
}));

vi.mock("@/lib/whatsapp/resolve-tenant", () => ({
  resolveTenantByChatwootInbox: state.resolve,
}));

vi.mock("@/lib/conversations/mirror", () => ({
  mirrorMessage: state.mirror,
  __resetMirroredMessageIds: vi.fn(),
}));

vi.mock("@/lib/chatwoot/client", () => ({
  sendChatwootMessage: state.send,
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
  },
}));

vi.mock("@/lib/tenant-context", () => ({
  withTenant: async (_tenantId: string, fn: (tx: unknown) => Promise<unknown>) => fn({}),
}));

const { POST } = await import("@/app/api/webhooks/chatwoot/route");

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://example.com/api/webhooks/chatwoot", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.CHATWOOT_WEBHOOK_SECRET = "secret";
  process.env.CHATWOOT_API_TOKEN = "token";
  state.verify.mockReset();
  state.parse.mockReset();
  state.resolve.mockReset();
  state.mirror.mockReset();
  state.send.mockReset();
  state.verify.mockReturnValue(true);
  state.parse.mockImplementation((raw: string) => JSON.parse(raw));
  state.resolve.mockResolvedValue({ tenantId: "tenant-1", channelId: "cred-1" });
  state.mirror.mockResolvedValue({ created: true });
  state.send.mockResolvedValue({ id: 1 });
});

describe("POST /api/webhooks/chatwoot", () => {
  it("returns 401 on invalid signature", async () => {
    state.verify.mockReturnValue(false);
    const res = await POST(makeRequest({ event: "message_created", id: 1 }, { "x-chatwoot-signature": "bad", "x-chatwoot-timestamp": "1" }));
    expect(res.status).toBe(401);
    expect(state.mirror).not.toHaveBeenCalled();
  });

  it("returns 200 and ignores non-message_created events", async () => {
    const res = await POST(makeRequest({ event: "conversation_updated", id: 1 }));
    expect(res.status).toBe(200);
    expect(state.mirror).not.toHaveBeenCalled();
    expect(state.send).not.toHaveBeenCalled();
  });

  it("mirrors and responds on valid message", async () => {
    const body = {
      event: "message_created",
      id: 42,
      content: "hola",
      account: { id: 7 },
      conversation: { id: 99, inbox_id: 5 },
      sender: { id: 123, phone_number: "+569..." },
    };
    const res = await POST(makeRequest(body, { "x-chatwoot-signature": "sig", "x-chatwoot-timestamp": "1" }));
    expect(res.status).toBe(200);
    expect(state.resolve).toHaveBeenCalledWith(5);
    expect(state.mirror).toHaveBeenCalledTimes(1);
    expect(state.send).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate on replay", async () => {
    state.mirror
      .mockResolvedValueOnce({ created: true })
      .mockResolvedValueOnce({ created: false });
    const body = {
      event: "message_created",
      id: 42,
      content: "hola",
      account: { id: 7 },
      conversation: { id: 99, inbox_id: 5 },
      sender: { id: 123 },
    };
    const r1 = await POST(makeRequest(body, { "x-chatwoot-signature": "sig", "x-chatwoot-timestamp": "1" }));
    const r2 = await POST(makeRequest(body, { "x-chatwoot-signature": "sig", "x-chatwoot-timestamp": "1" }));
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(state.send).toHaveBeenCalledTimes(1);
  });
});