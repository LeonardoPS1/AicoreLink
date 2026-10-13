import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AttentionTest } from "@/components/marketing/attention-test";
import { copy, formatCLP, presetWhatsappUrl } from "@/lib/marketing/copy";
import { ATTENTION_QUESTIONS, scoreAttention } from "@/lib/tools/attention-test";

type User = ReturnType<typeof userEvent.setup>;

/** Answers where the first `yes` questions are "sí" and the rest "no". */
function answersWith(yes: number) {
  return Object.fromEntries(
    ATTENTION_QUESTIONS.map((question, index) => [question.id, index < yes]),
  );
}

async function answer(user: User, index: number, value: boolean) {
  const fieldsets = screen.getAllByRole("group");
  const label = value ? copy.attentionTest.yesLabel : copy.attentionTest.noLabel;
  await user.click(within(fieldsets[index]).getByRole("radio", { name: label }));
}

async function answerAll(user: User, yes: number) {
  for (let index = 0; index < ATTENTION_QUESTIONS.length; index += 1) {
    await answer(user, index, index < yes);
  }
}

describe("AttentionTest", () => {
  it("renders every question from the questionnaire and hides the result at rest", () => {
    render(<AttentionTest />);

    const fieldsets = screen.getAllByRole("group");
    expect(fieldsets).toHaveLength(ATTENTION_QUESTIONS.length);

    for (const question of ATTENTION_QUESTIONS) {
      expect(
        screen.getByRole("group", { name: (name) => name.includes(question.prompt) }),
      ).toBeInTheDocument();
    }

    // Analytics hook prepared for E1.7: the first question marks the start.
    expect(fieldsets[0]).toHaveAttribute("data-track", "tools_start");

    expect(screen.queryByText(copy.attentionTest.resultTitle)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: copy.attentionTest.ctaLabel }),
    ).not.toBeInTheDocument();
  });

  it("shows the result only once every question is answered", async () => {
    const user = userEvent.setup();
    render(<AttentionTest />);

    for (let index = 0; index < ATTENTION_QUESTIONS.length - 1; index += 1) {
      await answer(user, index, true);
    }
    expect(screen.queryByText(copy.attentionTest.resultTitle)).not.toBeInTheDocument();

    await answer(user, ATTENTION_QUESTIONS.length - 1, true);
    expect(await screen.findByText(copy.attentionTest.resultTitle)).toBeInTheDocument();
  });

  it("shows a 100/100 with no gaps when every answer is sí", async () => {
    const user = userEvent.setup();
    render(<AttentionTest />);

    await answerAll(user, ATTENTION_QUESTIONS.length);

    expect(screen.getByText("100/100")).toBeInTheDocument();
    expect(screen.getByText(copy.attentionTest.allClear)).toBeInTheDocument();

    const resultNode = screen.getByText(copy.attentionTest.resultTitle).closest("[data-score]");
    expect(resultNode).toHaveAttribute("data-score", "100");

    const link = screen.getByRole("link", { name: copy.attentionTest.ctaLabel });
    expect(link.getAttribute("href")).toContain("https://wa.me/");
    expect(link.getAttribute("href")).toContain(encodeURIComponent("saqué 100/100"));
    expect(link).toHaveAttribute(
      "href",
      presetWhatsappUrl("test", {
        puntaje: 100,
        brechas: [copy.attentionTest.noGapsBrecha],
      }),
    );
  });

  it("lists the detected gaps and points WhatsApp at the score and gaps", async () => {
    const user = userEvent.setup();
    render(<AttentionTest />);

    await answerAll(user, 4);

    const expected = scoreAttention(answersWith(4));
    expect(expected.score).toBe(50);
    expect(screen.getByText("50/100")).toBeInTheDocument();

    for (const gap of expected.gaps) {
      expect(screen.getByText(gap)).toBeInTheDocument();
    }

    const link = screen.getByRole("link", { name: copy.attentionTest.ctaLabel });
    expect(link).toHaveAttribute(
      "href",
      presetWhatsappUrl("test", { puntaje: expected.score, brechas: expected.gaps }),
    );
    expect(link.getAttribute("href")).toContain(encodeURIComponent(expected.gaps[0]));
  });

  it("appends the calculator estimate when the visitor arrives with ?monto", async () => {
    const user = userEvent.setup();
    render(<AttentionTest initialAmountCLP={260000} />);

    await answerAll(user, 4);

    const link = screen.getByRole("link", { name: copy.attentionTest.ctaLabel });
    expect(link.getAttribute("href")).toContain(encodeURIComponent(formatCLP(260000)));
    expect(link.getAttribute("href")).toContain(encodeURIComponent("260.000"));
  });
});
