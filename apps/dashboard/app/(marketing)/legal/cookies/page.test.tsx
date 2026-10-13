import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CookiesPage from "@/app/(marketing)/legal/cookies/page";
import { copy } from "@/lib/marketing/copy";

describe("CookiesPage", () => {
  it("renders the page title and description from copy.legal.cookies", () => {
    render(<CookiesPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Política de cookies");
    expect(screen.getByText(copy.legal.cookies.content.split("\n")[0].trim())).toBeInTheDocument();
  });

  it("contains key cookies sections (qué son, necesarias, analíticas, marketing, cómo gestionar)", () => {
    render(<CookiesPage />);

    const content = copy.legal.cookies.content.toLowerCase();
    expect(content).toContain("qué son");
    expect(content).toContain("necesarias");
    expect(content).toContain("analíticas");
    expect(content).toContain("marketing");
    expect(content).toContain("gestionar");
  });
});