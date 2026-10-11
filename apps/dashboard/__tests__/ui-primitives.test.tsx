import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { Accordion, type AccordionItem } from "@/components/ui/accordion";
import { Tabs, type TabItem } from "@/components/ui/tabs";

describe("Button", () => {
  it("renders its label and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Quiero mi sitio</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Quiero mi sitio" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Enviar
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("gives each variant a distinct class signature", () => {
    const primary = buttonClasses("primary");
    const secondary = buttonClasses("secondary");
    const ghost = buttonClasses("ghost");

    expect(new Set([primary, secondary, ghost]).size).toBe(3);
    expect(primary).toContain("bg-brand");
    expect(secondary).toContain("border");
    expect(ghost).toContain("hover:");
  });

  it("gives each size a distinct height", () => {
    const classes = ["sm", "md", "lg"].map((size) => buttonClasses("primary", size as "sm"));
    expect(new Set(classes).size).toBe(3);
  });

  it("merges a caller className without dropping variant classes", () => {
    const merged = buttonClasses("primary", "md", "w-full");
    expect(merged).toContain("w-full");
    expect(merged).toContain("bg-brand");
  });
});

describe("Card and Badge", () => {
  it("Card renders its children", () => {
    render(<Card>Contenido de la tarjeta</Card>);
    expect(screen.getByText("Contenido de la tarjeta")).toBeDefined();
  });

  it("Badge renders its children with a brand variant by default", () => {
    const { container } = render(<Badge>Más elegido</Badge>);
    expect(screen.getByText("Más elegido")).toBeDefined();
    expect(container.firstElementChild?.className).toContain("bg-");
  });
});

describe("SectionHeading", () => {
  it("renders an addressable heading plus subtitle", () => {
    render(<SectionHeading id="planes" eyebrow="Precios" title="Planes claros" subtitle="Sin costos escondidos" />);

    const heading = screen.getByRole("heading", { name: "Planes claros" });
    expect(heading.id).toBe("planes");
    expect(screen.getByText("Sin costos escondidos")).toBeDefined();
    expect(screen.getByText("Precios")).toBeDefined();
  });
});

const faqItems: AccordionItem[] = [
  { id: "q1", question: "¿Qué incluye la cuota?", answer: "Todo incluido." },
  { id: "q2", question: "¿Necesito saber tecnología?", answer: "No, nada." },
];

describe("Accordion", () => {
  it("renders every question collapsed by default", () => {
    render(<Accordion items={faqItems} />);

    const triggers = screen.getAllByRole("button");
    expect(triggers).toHaveLength(2);
    for (const trigger of triggers) {
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
    }
  });

  it("expands the clicked question and collapses the previous one", async () => {
    render(<Accordion items={faqItems} />);

    const first = screen.getByRole("button", { name: "¿Qué incluye la cuota?" });
    const second = screen.getByRole("button", { name: "¿Necesito saber tecnología?" });

    await userEvent.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");

    await userEvent.click(second);
    expect(second.getAttribute("aria-expanded")).toBe("true");
    expect(first.getAttribute("aria-expanded")).toBe("false");
  });

  it("toggles a question closed on second click", async () => {
    render(<Accordion items={faqItems} />);

    const first = screen.getByRole("button", { name: "¿Qué incluye la cuota?" });

    await userEvent.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");

    await userEvent.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("false");
  });
});

const tabItems: TabItem[] = [
  { id: "a", label: "Barberías", content: <p>Contenido de barberías</p> },
  { id: "b", label: "Talleres", content: <p>Contenido de talleres</p> },
];

describe("Tabs", () => {
  it("selects the first tab and shows its panel", () => {
    render(<Tabs items={tabItems} ariaLabel="Rubros" />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Contenido de barberías")).toBeDefined();
  });

  it("switches panel when clicking another tab", async () => {
    render(<Tabs items={tabItems} ariaLabel="Rubros" />);

    const tablist = screen.getByRole("tablist", { name: "Rubros" });
    await userEvent.click(within(tablist).getByRole("tab", { name: "Talleres" }));

    const tabs = screen.getAllByRole("tab");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
  });

  it("moves selection with arrow keys", async () => {
    render(<Tabs items={tabItems} ariaLabel="Rubros" />);

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");

    const tabs = screen.getAllByRole("tab");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  });
});
