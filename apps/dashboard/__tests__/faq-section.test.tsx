import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FaqSection } from "@/components/marketing/faq-section";
import { copy } from "@/lib/marketing/copy";

describe("FaqSection", () => {
  it("renders the anchor, title and subtitle", () => {
    const { container } = render(<FaqSection />);

    expect(container.querySelector("section#preguntas")).not.toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: copy.faq.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.faq.subtitle)).toBeInTheDocument();
  });

  it("renders every question as an accordion trigger", () => {
    render(<FaqSection />);

    const triggers = copy.faq.items.map((item) =>
      screen.getByRole("button", { name: item.question }),
    );

    expect(triggers).toHaveLength(copy.faq.items.length);
    triggers.forEach((trigger) => {
      expect(trigger).toHaveAttribute("aria-expanded");
    });
  });

  it("shows only the first answer by default", () => {
    render(<FaqSection />);

    const [first, ...rest] = copy.faq.items;

    expect(screen.getByRole("button", { name: first.question })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    rest.forEach((item) => {
      expect(screen.getByRole("button", { name: item.question })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  });

  it("reveals an answer when its question is clicked", async () => {
    const user = userEvent.setup();
    render(<FaqSection />);

    const target = copy.faq.items[3];
    const targetTrigger = screen.getByRole("button", { name: target.question });

    await user.click(targetTrigger);

    expect(targetTrigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: copy.faq.items[0].question }),
    ).toHaveAttribute("aria-expanded", "false");

    const panel = document.getElementById(
      targetTrigger.getAttribute("aria-controls") ?? "",
    );
    expect(panel).toHaveAttribute("data-state", "open");
    expect(panel).toHaveTextContent(target.answer);
  });
});
