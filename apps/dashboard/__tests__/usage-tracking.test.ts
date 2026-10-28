import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  create: vi.fn(),
  costRateFindMany: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      throw new Error("must not open client");
    }
  },
}));

import { recordUsage } from "@/lib/usage";

describe("usage tracking", () => {
  beforeEach(() => {
    state.findUnique.mockReset();
    state.update.mockReset();
    state.upsert.mockReset();
    state.create.mockReset();
    state.costRateFindMany.mockReset();
  });

  it("upserts tenant usage for the period", async () => {
    state.upsert.mockResolvedValue({ id: "usage-1" });
    const tx = {
      tenantUsage: { findUnique: state.findUnique, update: state.update, upsert: state.upsert, create: state.create },
      costRate: { findMany: state.costRateFindMany },
    };
    const period = new Date("2026-02-01T00:00:00.000Z");
    const r = await recordUsage(tx, {
      tenantId: "tenant-1",
      channel: "whatsapp_text",
      period,
      messagesIn: 1,
      messagesOut: 1,
      tokensUsed: 10,
      costEstimate: 0.005,
    });
    expect(r).toBeTruthy();
    expect(state.upsert).toHaveBeenCalledTimes(1);
    const args = state.upsert.mock.calls[0][0];
    expect(args.where).toEqual({
      tenantId_channel_period: { tenantId: "tenant-1", channel: "whatsapp_text", period },
    });
    expect(args.create).toMatchObject({ tenantId: "tenant-1", tokensUsed: 10 });
  });

  it("computes cost from cost rates when not provided", async () => {
    state.upsert.mockResolvedValue({ id: "usage-2" });
    state.costRateFindMany.mockResolvedValue([{ provider: "openrouter", unit: "token", rate: 0.001 }]);
    const tx = {
      tenantUsage: { upsert: state.upsert },
      costRate: { findMany: state.costRateFindMany },
    };
    await recordUsage(tx, {
      tenantId: "tenant-1",
      tokensUsed: 100,
      provider: "openrouter",
    });
    const args = state.upsert.mock.calls[0][0];
    expect(args.create.costEstimate).toBe(0.1);
  });
});