import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  findFirst: vi.fn(),
  rawCalls: [] as Array<{ sql: string; args: unknown[] }>,
  transactions: 0,
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
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      state.transactions += 1;
      const tx = {
        $executeRawUnsafe: async (sql: string, ...args: unknown[]) => {
          state.rawCalls.push({ sql, args });
          return 0;
        },
        channelCredential: { findFirst: state.findFirst },
      };
      return fn(tx);
    },
  },
}));

import { resolveTenantByChatwootInbox } from "@/lib/whatsapp/resolve-tenant";

describe("resolveTenantByChatwootInbox", () => {
  beforeEach(() => {
    state.findFirst.mockReset();
    state.rawCalls.length = 0;
    state.transactions = 0;
  });

  it("resolves an existing inbox to tenant + channel", async () => {
    state.findFirst.mockResolvedValue({ tenantId: "tenant-1", id: "cred-1" });
    const result = await resolveTenantByChatwootInbox("inbox-42");
    expect(result).toEqual({ tenantId: "tenant-1", channelId: "cred-1" });
    expect(state.findFirst).toHaveBeenCalledWith({
      where: { provider: "chatwoot", externalId: "inbox-42", enabled: true },
      select: { tenantId: true, id: true },
    });
  });

  it("returns null when inbox does not exist", async () => {
    state.findFirst.mockResolvedValue(null);
    expect(await resolveTenantByChatwootInbox("missing")).toBeNull();
  });

  it("uses asAdmin so RLS does not filter the lookup", async () => {
    state.findFirst.mockResolvedValue({ tenantId: "tenant-1", id: "cred-1" });
    await resolveTenantByChatwootInbox("inbox-42");
    expect(state.transactions).toBe(1);
    expect(state.rawCalls[0].sql).toMatch(/set_config\(\s*'role'/);
    expect(state.rawCalls[0].args).toEqual(["aicorelink_admin"]);
  });
});