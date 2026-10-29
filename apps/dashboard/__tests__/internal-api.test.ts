import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  mirror: vi.fn(),
  recordUsage: vi.fn(),
  withTenant: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      throw new Error("must not open client");
    }
  },
}));

vi.mock("@/lib/tenant-context", () => ({
  withTenant: state.withTenant,
}));

vi.mock("@/lib/conversations/mirror", () => ({
  mirrorMessage: state.mirror,
}));

vi.mock("@/lib/usage", () => ({
  recordUsage: state.recordUsage,
  default: state.recordUsage,
}));

import { POST as POST_MESSAGES, GET as GET_MESSAGES } from "@/app/api/internal/messages/route";
import { POST as POST_USAGE, GET as GET_USAGE } from "@/app/api/internal/usage/route";

const MSG_URL = "http://localhost:3000/api/internal/messages";
const USAGE_URL = "http://localhost:3000/api/internal/usage";

describe("internal api auth", () => {
  beforeEach(() => {
    process.env.FACTORY_INTERNAL_API_KEY = "internal-secret";
    state.withTenant.mockReset();
    state.mirror.mockReset();
    state.recordUsage.mockReset();
    state.withTenant.mockImplementation(async (_tenantId: string, fn: (tx: any) => any) => fn({}));
    state.mirror.mockResolvedValue({ created: true });
    state.recordUsage.mockResolvedValue({ id: "usage-1" });
  });

  it("rejects messages with no key", async () => {
    const res = await POST_MESSAGES(new Request(MSG_URL, { method: "POST", body: JSON.stringify({ tenantId: "t1" }) }));
    expect(res.status).toBe(401);
    expect(state.mirror).not.toHaveBeenCalled();
  });

  it("rejects messages with wrong key", async () => {
    const res = await POST_MESSAGES(new Request(MSG_URL, { method: "POST", headers: { "x-internal-key": "nope" }, body: JSON.stringify({ tenantId: "t1" }) }));
    expect(res.status).toBe(401);
  });

  it("fails closed when key not configured (messages)", async () => {
    delete process.env.FACTORY_INTERNAL_API_KEY;
    const res = await POST_MESSAGES(new Request(MSG_URL, { method: "POST", headers: { "x-internal-key": "anything" }, body: JSON.stringify({ tenantId: "t1" }) }));
    expect(res.status).toBe(401);
  });

  it("mirrors a message with valid key", async () => {
    const res = await POST_MESSAGES(
      new Request(MSG_URL, {
        method: "POST",
        headers: { "x-internal-key": "internal-secret", "content-type": "application/json" },
        body: JSON.stringify({ tenantId: "t1", contactRef: "c1", direction: "in", content: "hola" }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(state.withTenant).toHaveBeenCalledWith("t1", expect.any(Function));
    expect(state.mirror).toHaveBeenCalledTimes(1);
  });

  it("rejects usage with no key", async () => {
    const res = await POST_USAGE(new Request(USAGE_URL, { method: "POST", body: JSON.stringify({ tenantId: "t1" }) }));
    expect(res.status).toBe(401);
    expect(state.recordUsage).not.toHaveBeenCalled();
  });

  it("records usage with valid key", async () => {
    const res = await POST_USAGE(
      new Request(USAGE_URL, {
        method: "POST",
        headers: { "x-internal-key": "internal-secret", "content-type": "application/json" },
        body: JSON.stringify({ tenantId: "t1", model: "mistral", tokensIn: 10, tokensOut: 20 }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(state.withTenant).toHaveBeenCalledWith("t1", expect.any(Function));
    expect(state.recordUsage).toHaveBeenCalledTimes(1);
  });

  it("GET messages requires key", async () => {
    const res = await GET_MESSAGES(new Request(MSG_URL));
    expect(res.status).toBe(401);
  });

  it("GET usage requires key", async () => {
    const res = await GET_USAGE(new Request(USAGE_URL));
    expect(res.status).toBe(401);
  });
});