"use client";

import { useEffect, useState, type ChangeEvent } from "react";

import { WhatsAppGlyph } from "@/components/marketing/whatsapp-glyph";
import { buttonClasses } from "@/components/ui/button";
import {
  copy,
  formatCLP,
  presetWhatsappUrl,
  whatsappUrl,
  PRESET_MESSAGES,
} from "@/lib/marketing/copy";
import {
  ATTENTION_QUESTIONS,
  scoreAttention,
  type AttentionAnswers,
} from "@/lib/tools/attention-test";
import { trackToolsFinish } from "@/lib/analytics";

interface Props {
  /**
   * Monthly loss in CLP the visitor brought from the calculator (`?monto=<CLP>`),
   * if any. Ruling R14: it only travels in the message, never recomputed here.
   */
  initialAmountCLP?: number;
}

/** Fills the attention-test preset into its raw, still-unencoded message. */
function fillTestMessage(score: number, brechas: string[]): string {
  return PRESET_MESSAGES.test
    .replace("[puntaje]", String(score))
    .replace("[brechas]", brechas.join("; "));
}

/**
 * A perfect score leaves no gaps to list, which would render "Quiero mejorar: .",
 * so a short stand-in keeps the message readable.
 */
function brechasForMessage(gaps: string[]): string[] {
  return gaps.length > 0 ? gaps : [copy.attentionTest.noGapsBrecha];
}

function whatsappHref(score: number, gaps: string[], amountCLP?: number): string {
  const brechas = brechasForMessage(gaps);

  if (amountCLP === undefined) {
    return presetWhatsappUrl("test", { puntaje: score, brechas });
  }

  // The test preset carries no money placeholder (its text is fixed by ruling
  // R13), so a visitor who came from the calculator appends that estimate.
  const suffix = copy.attentionTest.amountSuffix.replace("{amount}", formatCLP(amountCLP));
  return whatsappUrl(`${fillTestMessage(score, brechas)} ${suffix}`);
}

/**
 * Public attention test ("¿Qué tan bien atiende tu negocio?"). Client-side only:
 * answers never leave the browser, the score and gaps are computed locally from
 * `scoreAttention`, and the only outbound action is the pre-filled WhatsApp
 * message the visitor chooses to send.
 *
 * The result is hidden until every question is answered, so a half-finished
 * quiz never flashes a misleading score.
 */
export function AttentionTest({ initialAmountCLP }: Props) {
  const [answers, setAnswers] = useState<AttentionAnswers>({});

  function answer(id: string, value: boolean) {
    return (_event: ChangeEvent<HTMLInputElement>) => {
      setAnswers((prev) => ({ ...prev, [id]: value }));
    };
  }

  const allAnswered = ATTENTION_QUESTIONS.every(
    (question) => answers[question.id] !== undefined,
  );
  const result = allAnswered ? scoreAttention(answers) : null;

  // Emit tools_finish programmatically when the result appears (R48: tracker treats
  // data-track as click, but the result appears without a click).
  useEffect(() => {
    if (result) {
      trackToolsFinish("test-atencion", { score: result.score });
    }
  }, [result]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] sm:p-8">
      <p className="text-sm text-slate-500">{copy.attentionTest.intro}</p>

      <div className="mt-6 space-y-5">
        {ATTENTION_QUESTIONS.map((question, index) => (
          <fieldset
            key={question.id}
            // Analytics hook prepared for E1.7, the owner of the funnel wiring:
            // touching the first question marks the start of the test.
            data-track={index === 0 ? "tools_start" : undefined}
            className="rounded-xl border border-slate-200 p-4"
          >
            <legend className="px-1 text-left text-sm font-medium text-navy">
              {index + 1}. {question.prompt}
            </legend>

            <div className="mt-3 flex gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name={question.id}
                  value="yes"
                  checked={answers[question.id] === true}
                  onChange={answer(question.id, true)}
                  className="size-4 accent-brand"
                />
                {copy.attentionTest.yesLabel}
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name={question.id}
                  value="no"
                  checked={answers[question.id] === false}
                  onChange={answer(question.id, false)}
                  className="size-4 accent-brand"
                />
                {copy.attentionTest.noLabel}
              </label>
            </div>
          </fieldset>
        ))}
      </div>

      <div aria-live="polite" role="status" className="mt-6">
        {result ? (
          <div data-score={result.score} className="rounded-xl border border-teal/25 bg-teal/5 p-5">
            <p className="text-sm font-medium text-slate-600">{copy.attentionTest.resultTitle}</p>
            <p className="mt-1 text-3xl font-semibold text-navy">
              {copy.attentionTest.scoreTemplate.replace("{score}", String(result.score))}
            </p>

            {result.gaps.length > 0 ? (
              <>
                <p className="mt-4 text-sm font-medium text-navy">{copy.attentionTest.gapsTitle}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {result.gaps.map((gap) => (
                    <li key={gap}>{gap}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-700">{copy.attentionTest.allClear}</p>
            )}

            <p className="mt-3 text-xs text-slate-500">{copy.attentionTest.disclaimer}</p>
          </div>
        ) : null}
      </div>

      {result ? (
        <a
          href={whatsappHref(result.score, result.gaps, initialAmountCLP)}
          data-label="test"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("primary", "lg", "mt-6 w-full")}
        >
          <WhatsAppGlyph className="size-5" />
          {copy.attentionTest.ctaLabel}
        </a>
      ) : null}
    </div>
  );
}
