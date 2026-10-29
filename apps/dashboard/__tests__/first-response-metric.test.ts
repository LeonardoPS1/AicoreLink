import { describe, expect, it } from "vitest";
import { firstResponseMs } from "@/lib/first-response-metric";

describe("first response metric", () => {
  it("computes ms between start and first reply", () => {
    expect(firstResponseMs(1000, 1500)).toBe(500);
  });

  it("handles Date objects", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const end = new Date("2026-01-01T00:00:01.250Z");
    expect(firstResponseMs(start, end)).toBe(1250);
  });

  it("returns 0 for negative diffs", () => {
    expect(firstResponseMs(2000, 1000)).toBe(0);
  });
});