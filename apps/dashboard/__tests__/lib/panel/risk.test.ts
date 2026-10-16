import { describe, expect, it } from "vitest";
import { riskLevelOf, type RiskInput } from "@/lib/panel/risk";

const healthy: RiskInput = {
  tenantStatus: "activo",
  hasEnabledChannel: true,
  siteStatus: "published",
  failedPublishes: 0,
  usageRatio: 0.2,
  daysSinceLastMessage: 1,
};

describe("riskLevelOf()", () => {
  it("returns bajo for a healthy client", () => {
    expect(riskLevelOf(healthy)).toBe("bajo");
  });

  it("returns alto when the client has no enabled channel", () => {
    expect(riskLevelOf({ ...healthy, hasEnabledChannel: false })).toBe("alto");
  });

  it("returns alto on a failed publish", () => {
    expect(riskLevelOf({ ...healthy, failedPublishes: 1, siteStatus: "published" })).toBe("alto");
  });

  it("returns alto when the client is over the plan limit", () => {
    expect(riskLevelOf({ ...healthy, usageRatio: 1 })).toBe("alto");
  });

  it("returns alto when the account is not active", () => {
    expect(riskLevelOf({ ...healthy, tenantStatus: "suspendido" })).toBe("alto");
  });

  it("returns medio at 80% of the quota or after 7 idle days", () => {
    expect(riskLevelOf({ ...healthy, usageRatio: 0.8 })).toBe("medio");
    expect(riskLevelOf({ ...healthy, daysSinceLastMessage: 7 })).toBe("medio");
  });

  it("returns alto after 14 idle days", () => {
    expect(riskLevelOf({ ...healthy, daysSinceLastMessage: 14 })).toBe("alto");
  });

  it("caps a client that never received a message at medio, with or without a site", () => {
    expect(riskLevelOf({ ...healthy, daysSinceLastMessage: null, siteStatus: "draft" })).toBe("medio");
    expect(riskLevelOf({ ...healthy, daysSinceLastMessage: null, siteStatus: null })).toBe("medio");
  });
});
