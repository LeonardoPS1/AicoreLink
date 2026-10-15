import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildNav } from "@/components/dashboard/nav";
import { AppShell } from "@/components/dashboard/app-shell";

describe("buildNav", () => {
  it("gives a business owner the client menu", () => {
    const hrefs = buildNav("cliente").map((i) => i.href);
    expect(hrefs).toEqual([
      "/dashboard",
      "/dashboard/leads",
      "/dashboard/conversaciones",
      "/dashboard/citas",
      "/dashboard/resenas",
      "/dashboard/sitio",
      "/dashboard/reportes",
      "/dashboard/soporte",
      "/dashboard/mi-cuenta",
    ]);
  });

  it("gives Aicore staff the internal menu and no client items", () => {
    const hrefs = buildNav("dev_aicore").map((i) => i.href);
    expect(hrefs).toContain("/dashboard/admin/tenants");
    expect(hrefs).toContain("/dashboard/admin/fabrica");
    expect(hrefs).not.toContain("/dashboard/leads");
  });

  it("marks the client-only modules as coming soon", () => {
    const soon = buildNav("cliente").filter((i) => i.soon).map((i) => i.href);
    expect(soon).toEqual([
      "/dashboard/citas",
      "/dashboard/resenas",
      "/dashboard/reportes",
      "/dashboard/soporte",
    ]);
  });
});

describe("AppShell", () => {
  it("shows the business name instead of a hardcoded tenant", () => {
    render(
      <AppShell role="cliente" email="d@n.cl" tenantName="Clínica Los Robles">
        <div>contenido</div>
      </AppShell>,
    );
    expect(screen.getByText("Clínica Los Robles")).toBeTruthy();
    expect(screen.queryByText("Clínica Demo")).toBeNull();
  });

  it("renders exactly one logout control", () => {
    render(
      <AppShell role="cliente" email="d@n.cl" tenantName="N">
        <div>contenido</div>
      </AppShell>,
    );
    expect(screen.getAllByText("Cerrar sesión")).toHaveLength(1);
  });

  it("shows the Aicore badge only for staff", () => {
    const { unmount } = render(
      <AppShell role="dev_aicore" email="l@a.cl" tenantName={null}>
        <div>c</div>
      </AppShell>,
    );
    expect(screen.getByText("Aicore")).toBeTruthy();
    unmount();
    render(
      <AppShell role="cliente" email="d@n.cl" tenantName="N">
        <div>c</div>
      </AppShell>,
    );
    expect(screen.queryByText("Aicore")).toBeNull();
  });
});
