import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  tx: { tenantChannel: { upsert: vi.fn(), findMany: vi.fn() } },
  withTenant: vi.fn(),
  asAdmin: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/tenant-context", () => ({
  withTenant: h.withTenant,
  asAdmin: h.asAdmin,
}));

vi.mock("@/lib/db", () => ({ db: {} }));

vi.mock("next-auth", () => ({
  getServerSession: h.getServerSession,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { PUT } from "@/app/api/tenants/channels/route";

function makeRequest(body: unknown) {
  return { json: async () => body } as any;
}

function session(role: string, tenantId?: string) {
  return { user: { id: "u1", role, tenantId } };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.withTenant.mockImplementation(async (_tenantId: string, fn: (tx: any) => unknown) => fn(h.tx));
  h.tx.tenantChannel.upsert.mockImplementation(async (args: any) => args.create);
  h.getServerSession.mockResolvedValue(session("cliente", "t1"));
});

describe("PUT /api/tenants/channels", () => {
  it("writes through the tenant-scoped connection and never through the admin one", async () => {
    const res = await PUT(makeRequest({ channel: "whatsapp_text", enabled: true }));

    expect(res.status).toBe(200);
    // The client panel must keep RLS as its last line of defence: this request
    // carries a real tenant, so it goes through withTenant().
    expect(h.withTenant).toHaveBeenCalledWith("t1", expect.any(Function));
    expect(h.asAdmin).not.toHaveBeenCalled();
    expect(h.tx.tenantChannel.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_channel: { tenantId: "t1", channel: "whatsapp_text" } },
        update: expect.objectContaining({ enabled: true }),
      }),
    );
  });

  it("rejects a channel that is not in the catalogue", async () => {
    const res = await PUT(makeRequest({ channel: "telegram", enabled: true }));

    expect(res.status).toBe(400);
    expect(h.withTenant).not.toHaveBeenCalled();
  });

  it("rejects a session with no tenant", async () => {
    h.getServerSession.mockResolvedValue(session("cliente"));

    const res = await PUT(makeRequest({ channel: "email", enabled: false }));

    expect(res.status).toBe(400);
    expect(h.withTenant).not.toHaveBeenCalled();
  });

  it("rejects a role that may not manage channels", async () => {
    h.getServerSession.mockResolvedValue(session("publico", "t1"));

    const res = await PUT(makeRequest({ channel: "email", enabled: false }));

    expect(res.status).toBe(403);
    expect(h.withTenant).not.toHaveBeenCalled();
  });
});
