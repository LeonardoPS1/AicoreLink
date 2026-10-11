import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LandingPage from "@/app/(marketing)/page";
import { copy } from "@/lib/marketing/copy";

describe("LandingPage", () => {
  it("renders every section anchor the header nav links to", () => {
    const { container } = render(<LandingPage />);

    const anchors = ["que-es", "problema", "solucion", "como-funciona", "rubros", "planes"];

    anchors.forEach((anchor) => {
      expect(container.querySelector(`[id="${anchor}"]`)).not.toBeNull();
    });
  });

  it("renders the sections in the planned top-to-bottom order", () => {
    const { container } = render(<LandingPage />);

    const order = ["que-es", "como-funciona", "rubros", "planes", "contacto"];
    const ids = Array.from(container.querySelectorAll("[id]")).map((el) => el.id);
    const positions = order.map((id) => ids.indexOf(id));

    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions.every((position) => position >= 0)).toBe(true);
  });

  it("shows the hero headline once, as the page's only h1", () => {
    render(<LandingPage />);

    const headings = screen.getAllByRole("heading", { level: 1 });

    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(copy.hero.headline);
  });
});
