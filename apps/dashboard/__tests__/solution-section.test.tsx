import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SolutionSection } from "@/components/marketing/solution-section";
import { copy } from "@/lib/marketing/copy";

describe("SolutionSection", () => {
  it("frames the product as attract, convert, attend", () => {
    render(<SolutionSection />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(copy.solution.title);

    const columns = screen.getAllByRole("heading", { level: 3 }).map((node) => node.textContent);
    expect(columns).toEqual(["Atrae", "Convierte", "Atiende"]);
  });

  it("explains what each column does", () => {
    render(<SolutionSection />);

    for (const column of copy.solution.columns) {
      expect(screen.getByText(column.description)).toBeInTheDocument();
    }
  });
});
