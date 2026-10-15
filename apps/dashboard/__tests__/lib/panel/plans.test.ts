import { describe, expect, it } from "vitest";
import {
  LEGACY_PLAN_ALIASES, PLANS, PLAN_CODES, normalizePlan, planDefinition,
} from "@/lib/panel/plans";

describe("panel plan catalogue", () => {
  it("exposes exactly the three sellable plans", () => {
    expect(PLAN_CODES).toEqual(["starter", "growth", "elite"]);
  });

  it("prices match the marketing copy (CLP, sin IVA)", () => {
    expect(PLANS.starter.priceCLP).toBe(19990);
    expect(PLANS.growth.priceCLP).toBe(49990);
    expect(PLANS.elite.priceCLP).toBe(99990);
  });

  it("monthly conversation quotas are 300 / 1500 / 5000", () => {
    expect(PLANS.starter.conversationsPerMonth).toBe(300);
    expect(PLANS.growth.conversationsPerMonth).toBe(1500);
    expect(PLANS.elite.conversationsPerMonth).toBe(5000);
  });

  it("site change quotas are 1 / 3 / 8", () => {
    expect(PLANS.starter.siteChangesPerMonth).toBe(1);
    expect(PLANS.growth.siteChangesPerMonth).toBe(3);
    expect(PLANS.elite.siteChangesPerMonth).toBe(8);
  });

  it("matches the SRD 3.2 fair-use table for voice minutes and template messages", () => {
    // Voice is Elite-only: the SRD prints "-" for Starter and Growth.
    expect(PLANS.starter.voiceMinutesPerMonth).toBe(0);
    expect(PLANS.growth.voiceMinutesPerMonth).toBe(0);
    expect(PLANS.elite.voiceMinutesPerMonth).toBe(120);
    expect(PLANS.starter.templateMessagesPerMonth).toBe(0);
    expect(PLANS.growth.templateMessagesPerMonth).toBe(300);
    expect(PLANS.elite.templateMessagesPerMonth).toBe(1000);
  });

  it("normalizes the legacy schema default to starter", () => {
    expect(LEGACY_PLAN_ALIASES.basico).toBe("starter");
    expect(normalizePlan("basico")).toBe("starter");
  });

  it("normalizes case and whitespace, and falls back to starter for unknown values", () => {
    expect(normalizePlan(" Growth ")).toBe("growth");
    expect(normalizePlan("ELITE")).toBe("elite");
    expect(normalizePlan(null)).toBe("starter");
    expect(normalizePlan(undefined)).toBe("starter");
    expect(normalizePlan("plan-inventado")).toBe("starter");
  });

  it("planDefinition never returns undefined", () => {
    expect(planDefinition("plan-inventado").code).toBe("starter");
    expect(planDefinition("growth").label).toBe("Growth");
  });
});
