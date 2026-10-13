/**
 * Lead-cost calculator — pure math behind the public
 * "¿Cuánto te cuesta no responder?" tool at /herramientas/calculadora.
 *
 * Kept free of React, `Date` and browser APIs so it runs identically in the
 * component and in a plain Node test. The model answers one question with the
 * visitor's own numbers: how much revenue goes out the door every month when a
 * share of incoming messages never gets a timely answer.
 */

export type LostRevenueInput = {
  messagesPerWeek: number;
  unansweredPct: number; // 0..100
  avgTicketCLP: number; // CLP, integer
  closeRate: number; // 0..100
};

export type LostRevenueResult = { monthlyLostCLP: number };

/**
 * Coerces an input to a finite number greater than zero. Negative values, `NaN`
 * and `Infinity` all collapse to `0`, so a cleared or malformed number field can
 * never leak `NaN` into the rendered estimate.
 */
function sanitize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Estimation model (ruling R2):
 *
 *   monthlyLostCLP = round(
 *     avgTicketCLP * (unansweredPct / 100) * (closeRate / 100)
 *       * messagesPerWeek * (52 / 12)
 *   )
 *
 * `messagesPerWeek` is scaled to a calendar month with `52 / 12` (a month is
 * ~4.333 weeks), which is why an average ticket of 25.000, 20% unanswered, 30%
 * close rate and 40 messages a week yields 260.000 and not 60.000.
 *
 * Out-of-range inputs (negative, `NaN`, `Infinity`) are treated as `0` to keep
 * the output predictable. See `lib/tools/calculator.test.ts` for the pinned
 * cases.
 */
export function computeLostRevenue(input: LostRevenueInput): LostRevenueResult {
  const messagesPerWeek = sanitize(input.messagesPerWeek);
  const unansweredPct = sanitize(input.unansweredPct);
  const avgTicketCLP = sanitize(input.avgTicketCLP);
  const closeRate = sanitize(input.closeRate);

  const monthlyLostCLP = Math.round(
    avgTicketCLP * (unansweredPct / 100) * (closeRate / 100) * messagesPerWeek * (52 / 12),
  );

  return { monthlyLostCLP };
}
