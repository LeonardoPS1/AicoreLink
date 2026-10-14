import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_NAV } from "@/components/admin/admin-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/fabrica" }));

function renderShell() {
  return render(
    <AdminShell>
      <p>contenido</p>
    </AdminShell>,
  );
}

describe("AdminShell", () => {
  it("renders one link per nav entry with the configured href", () => {
    renderShell();

    for (const item of ADMIN_NAV) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }
  });

  it("marks the active route with aria-current and leaves the others unmarked", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "Fábrica" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Tenants" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("renders an icon inside every nav entry", () => {
    renderShell();

    const nav = screen.getByRole("navigation", { name: "Navegación principal" });

    for (const item of ADMIN_NAV) {
      expect(
        within(nav).getByRole("link", { name: item.label }).querySelector("svg"),
      ).not.toBeNull();
    }
  });

  it("flags the disabled entries so they are visibly out of service", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "Métricas" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("link", { name: "Fábrica" })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("shows the title of the active section in the header", () => {
    renderShell();

    expect(screen.getByTestId("admin-page-title")).toHaveTextContent("Fábrica");
  });

  it("keeps the page content inside the main region", () => {
    renderShell();

    expect(
      within(screen.getByRole("main")).getByText("contenido"),
    ).toBeInTheDocument();
  });

  it("exposes a sign-out link", () => {
    renderShell();

    expect(screen.getByRole("link", { name: /cerrar sesión/i })).toHaveAttribute(
      "href",
      "/api/auth/signout",
    );
  });

  it("toggles the mobile drawer and closes it with Escape", async () => {
    renderShell();

    const toggle = screen.getByRole("button", { name: "Abrir menú" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
