import { describe, expect, it } from "vitest";

import {
  ATTENTION_QUESTIONS,
  scoreAttention,
  type AttentionAnswers,
} from "@/lib/tools/attention-test";

/** Builds an answer map where the first `yes` questions are "sí" and the rest "no". */
function answersWith(yes: number): AttentionAnswers {
  return Object.fromEntries(
    ATTENTION_QUESTIONS.map((question, index) => [question.id, index < yes]),
  );
}

describe("scoreAttention (ruling R12)", () => {
  it("scores 100 with no gaps when the visitor answers sí to everything", () => {
    const result = scoreAttention(answersWith(ATTENTION_QUESTIONS.length));

    expect(result).toEqual({ score: 100, gaps: [] });
  });

  it("scores 0 and lists the 8 gaps in order when the visitor answers no to everything", () => {
    const result = scoreAttention(answersWith(0));

    expect(result.score).toBe(0);
    expect(result.gaps).toEqual(ATTENTION_QUESTIONS.map((question) => question.gap));
  });

  it("scores the weighted average of a mixed set (4 of 8 sí)", () => {
    const result = scoreAttention(answersWith(4));

    expect(result.score).toBe(50);
    expect(result.gaps).toEqual(ATTENTION_QUESTIONS.slice(4).map((question) => question.gap));
  });

  it("honours explicit weights and rounds the result", () => {
    // 3 sí / 1 no → 100 * 3/4 = 75.
    expect(scoreAttention({ a: true, b: false }, { a: 3, b: 1 })).toEqual({
      score: 75,
      gaps: [],
    });
  });

  it("returns zero with no gaps when there are no answers", () => {
    expect(scoreAttention({})).toEqual({ score: 0, gaps: [] });
  });

  it("ignores unknown ids that carry neither a question nor a weight", () => {
    expect(scoreAttention({ nope: true })).toEqual({ score: 0, gaps: [] });
  });

  it("rounds a non-integer share (1 of 3 sí → 33)", () => {
    const threeAnswers: AttentionAnswers = Object.fromEntries(
      ATTENTION_QUESTIONS.slice(0, 3).map((question, index) => [question.id, index === 0]),
    );

    const result = scoreAttention(threeAnswers);

    expect(result.score).toBe(33);
    expect(result.gaps).toHaveLength(2);
  });

  it("does not count an unanswered question against the visitor", () => {
    // One sí and one no answered, third left blank → 50, not 33.
    const partial: AttentionAnswers = {
      [ATTENTION_QUESTIONS[0].id]: true,
      [ATTENTION_QUESTIONS[1].id]: false,
    };

    expect(scoreAttention(partial).score).toBe(50);
  });
});
