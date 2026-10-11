import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HowItWorks } from "@/components/marketing/how-it-works";
import { copy } from "@/lib/marketing/copy";

describe("HowItWorks", () => {
  it("renders the section title and one numbered item per step", () => {
    render(<HowItWorks />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(copy.howItWorks.title);
    expect(screen.getAllByRole("listitem")).toHaveLength(copy.howItWorks.steps.length);
  });

  it("lists the four steps in order", () => {
    render(<HowItWorks />);

    const titles = screen.getAllByRole("heading", { level: 3 }).map((node) => node.textContent);
    expect(titles).toEqual(copy.howItWorks.steps.map((step) => step.title));
  });
});
