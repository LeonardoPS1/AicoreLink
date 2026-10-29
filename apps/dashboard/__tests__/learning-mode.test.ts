import { describe, expect, it, vi } from "vitest";

import {
  isUnanswered,
  createLearningRequest,
  approveAnswer,
  learn,
} from "@/lib/knowledge/learning";
import * as repo from "@/lib/knowledge/repository";

describe("learning mode", () => {
  const KB = [
    { category: "horario", question: "¿Qué días atienden?", answer: "Lunes a sábado." },
  ];

  it("detects an unanswered question", () => {
    expect(isUnanswered("¿Cuál es el precio?", KB)).toBe(true);
    expect(isUnanswered("¿Qué días atienden?", KB)).toBe(false);
  });

  it("creates a pending learning request and asks the owner", () => {
    const req = createLearningRequest({ tenantId: "t1", question: "¿Cuál es el precio?" });
    expect(req.status).toBe("pending");
    expect(req.ownerMessage).toContain("¿Cuál es el precio?");
  });

  it("persists an approved answer into the KB", async () => {
    const spy = vi.spyOn(repo, "createKnowledgeEntry").mockResolvedValue({
      id: "kb1",
      tenantId: "t1",
      category: "aprendido",
      question: "¿Cuál es el precio?",
      answer: "$10.000",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const res = await approveAnswer({
      tenantId: "t1",
      question: "¿Cuál es el precio?",
      answer: "$10.000",
    });

    expect(res.learned).toBe(true);
    expect(res.entry.answer).toBe("$10.000");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("learn alias works with positional args", async () => {
    const res = await learn("t1", "¿Horario festivo?", "Cerrado los festivos.");
    expect(res.saved).toBe(true);
  });
});