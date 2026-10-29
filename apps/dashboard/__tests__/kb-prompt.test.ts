import { describe, expect, it } from "vitest";

import { buildPrompt, buildSystemPrompt } from "@/lib/knowledge/prompt";

describe("kb prompt", () => {
  it("includes knowledge base and business hours", () => {
    const prompt = buildPrompt({
      tone: "amable",
      knowledgeBase: "Servicios: corte y barba.",
      businessHours: "09:00-18:00",
    });
    expect(prompt).toContain("Servicios: corte y barba.");
    expect(prompt).toContain("09:00-18:00");
  });

  it("uses Chilean tuteo and not voseo", () => {
    const prompt = buildPrompt({ tone: "amable", knowledgeBase: "x", businessHours: "09:00-18:00" });
    expect(prompt).toContain("tú");
    expect(prompt.toLowerCase()).not.toMatch(/\bvos\b/);
    expect(prompt.toLowerCase()).not.toMatch(/tenés|podés|sabés/);
  });

  it("alias works", () => {
    expect(buildSystemPrompt({ knowledgeBase: "x" })).toContain("x");
  });
});