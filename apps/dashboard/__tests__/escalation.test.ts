import { describe, expect, it } from "vitest";
import {
  escalateThread,
  isEscalated,
  isOpen,
  isClosed,
  canRespond,
  buildSummary,
  threadState,
  normalizeThreadState,
  shouldEscalate,
  closeThread,
  reactivateThread,
  HANDOFF_MESSAGE,
} from "@/lib/escalation";

describe("escalation", () => {
  it("marks thread as escalated", () => {
    const t = escalateThread({ messages: ["hola", "reclamo"], reason: "reclamo" });
    expect(threadState(t)).toBe("escalated");
    expect(isEscalated(t)).toBe(true);
    expect(canRespond(t)).toBe(false);
    expect(t.summary).toContain("reclamo");
  });

  it("builds summary from messages", () => {
    const s = buildSummary({ messages: ["msg1", "msg2"], reason: "keyword" });
    expect(s).toContain("msg1");
  });

  it("reactivates thread", async () => {
    const { reactivateThread } = await import("@/lib/escalation");
    const t = reactivateThread(escalateThread({}));
    expect(isOpen(t)).toBe(true);
    expect(canRespond(t)).toBe(true);
  });

  it("closes thread", () => {
    const t = closeThread({});
    expect(isClosed(t)).toBe(true);
    expect(canRespond(t)).toBe(false);
  });

  it("detects escalation need", () => {
    expect(shouldEscalate("quiero hablar con un humano")).toBe(true);
    expect(shouldEscalate("hola")).toBe(false);
  });

  it("normalizes states", () => {
    expect(normalizeThreadState("abierta")).toBe("open");
    expect(normalizeThreadState("escalada")).toBe("escalated");
    expect(normalizeThreadState("cerrada")).toBe("closed");
  });

  it("handoff message defined", () => {
    expect(HANDOFF_MESSAGE).toBeTruthy();
  });
});
