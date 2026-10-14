import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PainSection } from "@/components/marketing/pain-section";
import { copy } from "@/lib/marketing/copy";

describe("PainSection", () => {
  it("renders the section title as an h2", () => {
    render(<PainSection />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(copy.pains.title);
  });

  it("renders one card per pain point", () => {
    render(<PainSection />);

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(copy.pains.items.length);

    for (const item of copy.pains.items) {
      expect(screen.getByText(item.title)).toBeInTheDocument();
      expect(screen.getByText(item.description)).toBeInTheDocument();
    }
  });

  it("closes the section by naming the shared cause", () => {
    render(<PainSection />);

    expect(screen.getByText(copy.pains.closing)).toBeInTheDocument();
  });

  it("renders each pain as a native single-open details item", () => {
    const { container } = render(<PainSection />);
    const items = container.querySelectorAll('details[name="dolor"]');
    expect(items.length).toBe(copy.pains.items.length);
    items.forEach((el) => expect(el.querySelector("summary h3")?.textContent).toBeTruthy());
  });

  it("shows both the diagnosis and the AicoreLink outcome for every pain", () => {
    render(<PainSection />);
    copy.pains.items.forEach((item) => {
      expect(screen.getByText(item.whatHappened)).toBeInTheDocument();
      expect(screen.getByText(item.withAicoreLink)).toBeInTheDocument();
    });
  });
});
