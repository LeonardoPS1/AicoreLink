import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TermsPage from "@/app/(marketing)/legal/terminos/page";
import { copy } from "@/lib/marketing/copy";

describe("TermsPage", () => {
  it("renders the page title and description from copy.legal.terminos", () => {
    render(<TermsPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Términos y condiciones");
    expect(screen.getByText(copy.legal.terminos.content.split("\n")[0].trim())).toBeInTheDocument();
  });

  it("contains key terms sections (servicio, obligaciones, cancelación, propiedad intelectual, jurisdicción)", () => {
    render(<TermsPage />);

    const content = copy.legal.terminos.content.toLowerCase();
    expect(content).toContain("servicio");
    expect(content).toContain("obligaciones");
    expect(content).toContain("cancelación");
    expect(content).toContain("propiedad intelectual");
    expect(content).toContain("jurisdicción");
  });
});