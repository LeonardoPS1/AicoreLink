import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockTx } = vi.hoisted(() => ({
  mockTx: {
    site: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/tenant-context", () => ({
  withTenant: vi.fn(async (tenantId: string, fn: (tx: any) => unknown) => {
    if (!tenantId) throw new Error("withTenant() requiere un tenantId valido");
    return fn(mockTx);
  }),
}));

vi.mock("@/lib/db", () => ({ db: {} }));

import { approveSite, rejectSite } from "@/lib/factory/approval";

const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const SITE_ID = "22222222-2222-2222-2222-222222222222";

function makeSite(overrides: Record<string, unknown> = {}) {
  return { id: SITE_ID, tenantId: TENANT_ID, status: "review", ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTx.site.findUnique.mockResolvedValue(makeSite());
  mockTx.site.update.mockResolvedValue({ id: SITE_ID, status: "approved" });
});

describe("approveSite", () => {
  it("moves a reviewed site to approved", async () => {
    const result = await approveSite(SITE_ID, TENANT_ID);
    expect(result.status).toBe("approved");
    expect(mockTx.site.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "approved" } })
    );
  });

  it("rejects when the site is not found", async () => {
    mockTx.site.findUnique.mockResolvedValue(null);
    await expect(approveSite(SITE_ID, TENANT_ID)).rejects.toThrow("Site not found");
  });

  it("rejects when the site belongs to another tenant", async () => {
    mockTx.site.findUnique.mockResolvedValue(makeSite({ tenantId: "other" }));
    await expect(approveSite(SITE_ID, TENANT_ID)).rejects.toThrow("Site not owned by tenant");
  });

  it("rejects when the site is not in review", async () => {
    mockTx.site.findUnique.mockResolvedValue(makeSite({ status: "draft" }));
    await expect(approveSite(SITE_ID, TENANT_ID)).rejects.toThrow("Site status must be 'review'");
  });

  it("requires a tenant id", async () => {
    await expect(approveSite(SITE_ID, "")).rejects.toThrow("tenantId valido");
  });
});

describe("rejectSite", () => {
  it("sends a reviewed site back to draft with a reason", async () => {
    mockTx.site.update.mockResolvedValue({ id: SITE_ID, status: "draft" });
    const result = await rejectSite(SITE_ID, TENANT_ID, "Faltan precios");
    expect(result.status).toBe("draft");
    expect(result.reason).toBe("Faltan precios");
    expect(mockTx.site.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "draft" } })
    );
  });

  it("rejects when the site is not found", async () => {
    mockTx.site.findUnique.mockResolvedValue(null);
    await expect(rejectSite(SITE_ID, TENANT_ID, "x")).rejects.toThrow("Site not found");
  });

  it("rejects when the site is not in review", async () => {
    mockTx.site.findUnique.mockResolvedValue(makeSite({ status: "approved" }));
    await expect(rejectSite(SITE_ID, TENANT_ID, "x")).rejects.toThrow("Site status must be 'review'");
  });
});
