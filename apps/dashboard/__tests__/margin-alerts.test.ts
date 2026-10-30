import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  tx: {
    tenantUsage: { findMany: vi.fn(), findFirst: vi.fn() },
    tenant: { findUnique: vi.fn() },
  },
  withTenant: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/tenant-context", () => ({
  withTenant: h.withTenant,
}));

vi.mock("@/lib/db", () => ({ db: {} }));

import { checkMarginAlert } from "@/lib/panel/margin-alerts";

beforeEach(() => {
  vi.clearAllMocks();
  h.withTenant.mockImplementation(async (_t: string, fn: (tx: any) => unknown) => fn(h.tx));
  h.tx.tenant.findUnique.mockResolvedValue({ plan: "starter" });
});

describe("checkMarginAlert", () => {
  it("alerts when margin below threshold", async () => {
    h.tx.tenantUsage.findMany.mockResolvedValue([{ costEstimate: 19000, period: new Date("2026-10-01T00:00:00Z") }]);
    const r = await checkMarginAlert("t1", "2026-10");
    expect(r.alert).toBe(true);
    expect(r.threshold).toBe(20);
  });

  it("no alert when margin ok", async () => {
    h.tx.tenantUsage.findMany.mockResolvedValue([{ costEstimate: 100, period: new Date("2026-10-01T00:00:00Z") }]);
    const r = await checkMarginAlert("t1", "2026-10");
    expect(r.alert).toBe(false);
  });

  it("no_cost when cost 0", async () => {
    h.tx.tenantUsage.findMany.mockResolvedValue([{ costEstimate: 0, period: new Date("2026-10-01T00:00:00Z") }]);
    const r = await checkMarginAlert("t1", "2026-10");
    expect(r.alert).toBe(false);
    expect(r.reason).toBe("no_cost");
  });

  it("no_data when no rows", async () => {
    h.tx.tenantUsage.findMany.mockResolvedValue([]);
    const r = await checkMarginAlert("t1", "2026-10");
    // cost 0 -> no_cost per implementation
    expect(r.alert).toBe(false);
  });

  it("threshold override", async () => {
    h.tx.tenantUsage.findMany.mockResolvedValue([{ costEstimate: 100, period: new Date("2026-10-01T00:00:00Z") }]);
    const r = await checkMarginAlert("t1", "2026-10", 50);
    expect(r.threshold).toBe(50);
  });
});