import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  upsert: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      throw new Error("must not open client");
    }
  },
}));

import { conversationKey, findOrCreateConversation } from "@/lib/conversations/identity";

describe("conversationKey", () => {
  it("is deterministic", () => {
    expect(conversationKey("tenant-1", 42)).toBe("cw_tenant-1_42");
    expect(conversationKey("tenant-1", "abc")).toBe("cw_tenant-1_abc");
  });
});

describe("findOrCreateConversation", () => {
  beforeEach(() => {
    state.upsert.mockReset();
  });

  it("returns the same row for the same key", async () => {
    const row = { id: "conv-1", tenantId: "tenant-1", externalId: "cw_tenant-1_42" };
    state.upsert.mockResolvedValue(row);
    const tx = { conversation: { upsert: state.upsert } };

    const a = await findOrCreateConversation(tx, "tenant-1", "cw_tenant-1_42", "contact-1");
    const b = await findOrCreateConversation(tx, "tenant-1", "cw_tenant-1_42", "contact-1");

    expect(a).toBe(row);
    expect(b).toBe(row);
    expect(a.id).toBe(b.id);
  });

  it("creates distinct rows for distinct keys", async () => {
    state.upsert
      .mockResolvedValueOnce({ id: "conv-1" })
      .mockResolvedValueOnce({ id: "conv-2" });
    const tx = { conversation: { upsert: state.upsert } };

    const a = await findOrCreateConversation(tx, "tenant-1", "cw_tenant-1_1", "c1");
    const b = await findOrCreateConversation(tx, "tenant-1", "cw_tenant-1_2", "c2");

    expect(a.id).not.toBe(b.id);
  });

  it("is idempotent (upsert by tenant+external)", async () => {
    state.upsert.mockResolvedValue({ id: "conv-1" });
    const tx = { conversation: { upsert: state.upsert } };

    await findOrCreateConversation(tx, "tenant-1", "cw_tenant-1_42", "contact-1");
    await findOrCreateConversation(tx, "tenant-1", "cw_tenant-1_42", "contact-1");

    expect(state.upsert).toHaveBeenCalledTimes(2);
  });
});