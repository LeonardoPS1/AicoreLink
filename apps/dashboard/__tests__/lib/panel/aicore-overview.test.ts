import { describe, expect, it } from "vitest";
import {
  buildConversationAlerts,
  buildGlanceRow,
  failedPublishFilter,
} from "@/lib/panel/aicore-overview";
import { FAILED_PUBLISH_WINDOW_MS } from "@/lib/panel/risk";

describe("failedPublishFilter()", () => {
  it("windows failed publications so a stale failure stops counting", () => {
    const since = new Date("2026-10-13T12:00:00.000Z");
    expect(failedPublishFilter(since)).toEqual({
      status: "failed",
      createdAt: { gte: since },
    });
  });

  it("keeps the glance and the alert list on the same 24h window", () => {
    expect(FAILED_PUBLISH_WINDOW_MS).toBe(24 * 60 * 60 * 1000);
  });
});

describe("buildGlanceRow()", () => {
  it("marks a client over the quota as high risk and keeps the real numbers", () => {
    const row = buildGlanceRow({
      tenantId: "t1", name: "Peluquería María", plan: "growth", status: "activo",
      usageThisMonth: 2000, channels: [{ channel: "whatsapp_text", enabled: true }],
      siteStatus: "published", failedPublishes: 0, lastMessageAt: new Date("2026-10-14T09:00:00.000Z"),
      now: new Date("2026-10-14T12:00:00.000Z"),
    });
    expect(row.planCode).toBe("growth");
    expect(row.usageLimit).toBe(1500);
    expect(row.usageRatio).toBeCloseTo(2000 / 1500);
    expect(row.risk).toBe("alto");
  });

  it("does not break on a legacy plan code", () => {
    const row = buildGlanceRow({
      tenantId: "t2", name: "Taller Demo", plan: "basico", status: "activo",
      usageThisMonth: 0, channels: [], siteStatus: null, failedPublishes: 0,
      lastMessageAt: null, now: new Date("2026-10-14T12:00:00.000Z"),
    });
    expect(row.planCode).toBe("starter");
    expect(row.usageLimit).toBe(300);
    expect(row.channelHealth).toBe("sin_canal");
    expect(row.lastMessageAt).toBeNull();
  });

  it("distinguishes a disabled channel from no channel at all", () => {
    const disabled = buildGlanceRow({
      tenantId: "t3", name: "Barbería", plan: "starter", status: "activo",
      usageThisMonth: 10, channels: [{ channel: "whatsapp_text", enabled: false }],
      siteStatus: "review", failedPublishes: 0, lastMessageAt: new Date(), now: new Date(),
    });
    expect(disabled.channelHealth).toBe("deshabilitado");
  });
});

describe("buildConversationAlerts()", () => {
  it("returns no alerts for a client list that is empty", () => {
    const alerts = buildConversationAlerts({
      tenants: [],
      now: new Date("2026-10-14T12:00:00.000Z"),
    });
    expect(alerts).toEqual([]);
  });
});
