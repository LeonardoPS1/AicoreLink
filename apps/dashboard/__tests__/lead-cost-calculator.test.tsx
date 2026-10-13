import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LeadCostCalculator } from "@/components/marketing/lead-cost-calculator";
import { copy, formatCLP, presetWhatsappUrl } from "@/lib/marketing/copy";

type FieldName = (typeof copy.calculator.fields)[number]["name"];

// 40 messages/week, 20% unanswered, $25.000 ticket, "3 of every 10" → closeRate 30.
// 25000 * 0.20 * 0.30 * 40 * (52/12) = 260000 (ruling R2).
const EXPECTED_MONTHLY_CLP = 260000;
const EXPECTED_RESULT = copy.calculator.resultTemplate.replace(
  "{amount}",
  formatCLP(EXPECTED_MONTHLY_CLP),
);

function inputFor(name: FieldName): HTMLInputElement {
  const field = copy.calculator.fields.find((candidate) => candidate.name === name);
  if (!field) throw new Error(`Unknown calculator field: ${name}`);
  return screen.getByLabelText(field.label) as HTMLInputElement;
}

async function fillWith(user: ReturnType<typeof userEvent.setup>, values: Record<FieldName, string>) {
  await user.type(inputFor("messagesPerWeek"), values.messagesPerWeek);
  await user.type(inputFor("unansweredPct"), values.unansweredPct);
  await user.type(inputFor("avgTicketCLP"), values.avgTicketCLP);
  await user.type(inputFor("closeRate"), values.closeRate);
}

describe("LeadCostCalculator", () => {
  it("renders the four labelled fields from copy and hides the result at rest", () => {
    render(<LeadCostCalculator />);

    for (const field of copy.calculator.fields) {
      expect(screen.getByLabelText(field.label)).toBeInTheDocument();
    }

    expect(screen.queryByText(EXPECTED_RESULT)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: copy.calculator.ctaLabel }),
    ).not.toBeInTheDocument();
    expect(inputFor("messagesPerWeek")).toHaveAttribute("data-track", "tools_start");
  });

  it("shows the estimate and a pre-filled WhatsApp link once all four fields are set", async () => {
    const user = userEvent.setup();
    render(<LeadCostCalculator />);

    await fillWith(user, {
      messagesPerWeek: "40",
      unansweredPct: "20",
      avgTicketCLP: "25000",
      closeRate: "3",
    });

    expect(await screen.findByText(EXPECTED_RESULT)).toBeInTheDocument();
    expect(screen.getByText(copy.calculator.disclaimer)).toBeInTheDocument();

    const result = screen.getByText(EXPECTED_RESULT);
    // tools_finish is now emitted programmatically via trackToolsFinish helper (R48)
    expect(result).toHaveAttribute("data-monthly-lost", String(EXPECTED_MONTHLY_CLP));

    const link = screen.getByRole("link", { name: copy.calculator.ctaLabel });
    expect(link).toHaveAttribute(
      "href",
      presetWhatsappUrl("calculadora", { amountCLP: EXPECTED_MONTHLY_CLP }),
    );
    expect(link.getAttribute("href")).toContain("https://wa.me/");
    expect(link.getAttribute("href")).toContain(
      encodeURIComponent("perdiendo $260.000 al mes"),
    );
  });

  it("keeps the result out of view until the estimate is positive", async () => {
    const user = userEvent.setup();
    render(<LeadCostCalculator />);

    // One field alone is not enough to estimate.
    await user.type(inputFor("messagesPerWeek"), "40");
    expect(screen.queryByText(EXPECTED_RESULT)).not.toBeInTheDocument();

    // A complete form that estimates zero must not flash a misleading "$0".
    await user.type(inputFor("unansweredPct"), "0");
    await user.type(inputFor("avgTicketCLP"), "0");
    await user.type(inputFor("closeRate"), "0");
    expect(screen.queryByText(/Hoy podrías estar perdiendo/)).not.toBeInTheDocument();

    // Clearing a field after a result hides it again.
    await user.clear(inputFor("messagesPerWeek"));
    await user.type(inputFor("messagesPerWeek"), "40");
    await user.type(inputFor("unansweredPct"), "20");
    await user.type(inputFor("avgTicketCLP"), "25000");
    await user.type(inputFor("closeRate"), "3");
    expect(await screen.findByText(EXPECTED_RESULT)).toBeInTheDocument();

    await user.clear(inputFor("closeRate"));
    expect(screen.queryByText(EXPECTED_RESULT)).not.toBeInTheDocument();
  });
});
