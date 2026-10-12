import { describe, expect, it } from "vitest";

import { computeLostRevenue, type LostRevenueInput } from "@/lib/tools/calculator";
import { formatCLP } from "@/lib/marketing/copy";

describe("computeLostRevenue", () => {
  it("matches the plan case (ruling R2)", () => {
    // Formula (binding, ruling R2):
    //   monthlyLostCLP = round(
    //     avgTicketCLP * (unansweredPct / 100) * (closeRate / 100)
    //       * messagesPerWeek * (52 / 12)
    //   )
    // Check: 25000 * 0.20 = 5000 ; 5000 * 0.30 = 1500 ; 1500 * 40 = 60000 ;
    // 60000 * (52 / 12) = 260000. (The plan's 26000 was a 10x typo.)
    expect(
      computeLostRevenue({ messagesPerWeek: 40, unansweredPct: 20, avgTicketCLP: 25000, closeRate: 30 }),
    ).toEqual({ monthlyLostCLP: 260000 });
  });

  it("formats the result the Chilean way (formatCLP from E1.0)", () => {
    expect(formatCLP(260000)).toBe("$260.000");
  });

  it("returns zero when every input is zero", () => {
    expect(
      computeLostRevenue({ messagesPerWeek: 0, unansweredPct: 0, avgTicketCLP: 0, closeRate: 0 }),
    ).toEqual({ monthlyLostCLP: 0 });
  });

  it("returns zero when nothing ever closes", () => {
    expect(
      computeLostRevenue({ messagesPerWeek: 40, unansweredPct: 20, avgTicketCLP: 25000, closeRate: 0 }),
    ).toEqual({ monthlyLostCLP: 0 });
  });

  it("returns zero when every message is answered in time", () => {
    expect(
      computeLostRevenue({ messagesPerWeek: 40, unansweredPct: 0, avgTicketCLP: 25000, closeRate: 30 }),
    ).toEqual({ monthlyLostCLP: 0 });
  });

  it("treats out-of-range inputs as zero (negative and NaN)", () => {
    // Both the negative and the NaN case collapse to 0: the UI reads free-text
    // number fields, so "-5" and "" must degrade to a safe estimate, not NaN.
    const negative: LostRevenueInput = {
      messagesPerWeek: -10,
      unansweredPct: 20,
      avgTicketCLP: 25000,
      closeRate: 30,
    };
    const notANumber: LostRevenueInput = {
      messagesPerWeek: Number.NaN,
      unansweredPct: 20,
      avgTicketCLP: 25000,
      closeRate: 30,
    };

    expect(computeLostRevenue(negative)).toEqual({ monthlyLostCLP: 0 });
    expect(computeLostRevenue(notANumber)).toEqual({ monthlyLostCLP: 0 });
  });

  it("rounds the fractional month to the nearest peso", () => {
    // 19990 * 0.20 * 0.30 * 7 * (52 / 12) = 36381.8 → 36382.
    expect(
      computeLostRevenue({ messagesPerWeek: 7, unansweredPct: 20, avgTicketCLP: 19990, closeRate: 30 }),
    ).toEqual({ monthlyLostCLP: 36382 });
  });
});
