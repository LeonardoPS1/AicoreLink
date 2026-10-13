import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Factory, Search } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

describe("Admin UI primitives", () => {
  it("StatCard renders label, value, and applies tone class", () => {
    const { container } = render(
      <StatCard label="Total sitios" value={4} icon={Factory} tone="brand" hint="todo" />,
    );
    expect(screen.getByText("Total sitios")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(container.firstChild).toBeInstanceOf(HTMLElement);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/brand/);
  });

  it("EmptyState renders title, description, and action", () => {
    render(
      <EmptyState
        icon={Search}
        title="Sin resultados"
        description="Prueba otro filtro"
        action={<button>Limpiar</button>}
      />,
    );
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    expect(screen.getByText("Prueba otro filtro")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar" })).toBeInTheDocument();
  });

  it("InitialsAvatar renders expected initials", () => {
    const { container } = render(<InitialsAvatar name="Barbería El Corte" />);
    expect(container.textContent).toContain("BC");
  });
});
