import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { VerticalsSection } from "@/components/marketing/verticals-section";
import { copy } from "@/lib/marketing/copy";
import { verticals } from "@/lib/marketing/verticals";

describe("VerticalsSection", () => {
  it("renders the section title and one tab per vertical", () => {
    render(<VerticalsSection />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(copy.verticals.title);
    expect(screen.getAllByRole("tab")).toHaveLength(verticals.length);

    for (const vertical of verticals) {
      expect(screen.getByRole("tab", { name: new RegExp(vertical.tab, "i") })).toBeInTheDocument();
    }
  });

  it("opens on the first vertical and swaps panels on click", async () => {
    const user = userEvent.setup();
    render(<VerticalsSection />);

    const [first, , third] = verticals;
    expect(screen.getByText(first.pain)).toBeVisible();
    expect(screen.getByText(third.pain)).not.toBeVisible();

    await user.click(screen.getByRole("tab", { name: new RegExp(third.tab, "i") }));

    expect(screen.getByText(third.pain)).toBeVisible();
    expect(screen.getByText(first.pain)).not.toBeVisible();
  });
});
