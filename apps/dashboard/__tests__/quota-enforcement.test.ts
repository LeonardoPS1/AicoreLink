import { describe, expect, it } from "vitest";
import {
  enforceQuota,
  isQuotaExhausted,
  isQuotaWarning,
  quotaStatus,
  QUOTA_WARNING_RATIO,
} from "@/lib/quota";

describe("quota enforcement", () => {
  it("allows when under 80%", () => {
    const r = quotaStatus({ plan: "starter", used: 100 });
    expect(r.allowed).toBe(true);
    expect(r.warning).toBe(false);
    expect(r.exhausted).toBe(false);
  });

  it("warns at 80%", () => {
    const r = enforceQuota({ plan: "starter", used: 240 });
    expect(r.warning).toBe(true);
    expect(r.exhausted).toBe(false);
    expect(r.message).toContain("80%");
  });

  it("exhausts at 100% and hands off", () => {
    const r = quotaStatus({ plan: "starter", used: 300 });
    expect(r.exhausted).toBe(true);
    expect(r.allowed).toBe(false);
    expect(r.handoff).toBe(true);
    expect(isQuotaExhausted({ plan: "starter", used: 300 })).toBe(true);
    expect(isQuotaWarning({ plan: "starter", used: 300 })).toBe(false);
  });

  it("uses plan limits from plans.ts", () => {
    expect(QUOTA_WARNING_RATIO).toBe(0.8);
    const r = quotaStatus("growth", 1500);
    expect(r.limit).toBe(1500);
    expect(r.exhausted).toBe(true);
  });
});