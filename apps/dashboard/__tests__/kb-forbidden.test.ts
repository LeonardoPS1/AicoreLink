import { describe, expect, it, vi, beforeEach } from "vitest";

import { isForbiddenTopic, isForbidden, normalizeForbiddenTopics } from "@/lib/knowledge/guardrails";
import { buildPrompt } from "@/lib/knowledge/prompt";
import * as repo from "@/lib/knowledge/repository";

describe("kb forbidden topics", () => {
  it("detects a forbidden topic in a message", () => {
    expect(isForbiddenTopic("¿Cuánto cuesta la marihuana?", ["marihuana", "drogas"])).toBe(true);
    expect(isForbidden("hola, ¿qué servicios tienen?", ["marihuana"])).toBe(false);
  });

  it("normalizes topic lists from various shapes", () => {
    expect(normalizeForbiddenTopics("a, b")).toEqual(["a", "b"]);
    expect(normalizeForbiddenTopics({ forbiddenTopics: ["x", "y"] })).toEqual(["x", "y"]);
  });

  it("prompt includes forbidden topics", () => {
    const prompt = buildPrompt({ tone: "amable", knowledgeBase: "x", forbiddenTopics: ["política", "religión"] });
    expect(prompt).toContain("Temas prohibidos");
    expect(prompt).toContain("política");
  });

  it("repository can store and read forbidden topics", async () => {
    // simple smoke: function exists
    expect(typeof repo.setForbiddenTopics).toBe("function");
    expect(typeof repo.getForbiddenTopics).toBe("function");
    expect(typeof repo.setTone).toBe("function");
    expect(typeof repo.getTone).toBe("function");
  });
});