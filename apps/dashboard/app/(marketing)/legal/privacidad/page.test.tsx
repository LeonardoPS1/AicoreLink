import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PrivacyPage from "@/app/(marketing)/legal/privacidad/page";
import { copy } from "@/lib/marketing/copy";

describe("PrivacyPage", () => {
  it("renders the page title and description from copy.legal.privacidad", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Política de privacidad");
    expect(screen.getByText(copy.legal.privacidad.content.split("\n")[0].trim())).toBeInTheDocument();
  });

  it("contains key privacy sections (datos, finalidad, derechos ARCO, contacto)", () => {
    render(<PrivacyPage />);

    const content = copy.legal.privacidad.content.toLowerCase();
    expect(content).toContain("datos");
    expect(content).toContain("finalidad");
    expect(content).toContain("arco");
    expect(content).toContain("contacto");
  });
});