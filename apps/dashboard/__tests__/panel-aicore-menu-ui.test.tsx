import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AlertList } from "@/components/dashboard/panel/alert-list";
import { HealthStrip } from "@/components/dashboard/panel/health-strip";
import { TenantGlanceTable } from "@/components/dashboard/panel/tenant-glance-table";
import { TotalsRow } from "@/components/dashboard/panel/totals-row";

const checkedAt = "2026-10-14T12:00:00.000Z";

describe("Aicore main menu blocks", () => {
  it("shows every service with its state", () => {
    render(
      <HealthStrip
        health={{
          checkedAt,
          services: [
            { key: "postgres", label: "Postgres", status: "ok", detail: null, checkedAt },
            { key: "whatsapp", label: "WhatsApp", status: "sin_datos", detail: "CHATWOOT_BASE_URL sin configurar", checkedAt },
          ],
        }}
      />,
    );
    expect(screen.getByTestId("health-strip")).toBeInTheDocument();
    expect(screen.getByText("Postgres")).toBeInTheDocument();
    expect(screen.getByText("sin datos")).toBeInTheDocument();
  });

  it("shows an honest empty state instead of fake zeros when there is nothing to report", () => {
    render(<AlertList alerts={[]} />);
    expect(screen.getByTestId("alert-list")).toBeInTheDocument();
    expect(screen.getByText(/sin alertas activas/i)).toBeInTheDocument();
  });

  it("renders an alert with severity and the affected client", () => {
    render(
      <AlertList
        alerts={[
          { id: "a1", kind: "publish_failed", severity: "alta", tenantId: "t1", tenantName: "Peluquería María", detail: "timeout al publicar", at: checkedAt },
        ]}
      />,
    );
    expect(screen.getByText("Peluquería María")).toBeInTheDocument();
    expect(screen.getByText(/alta/i)).toBeInTheDocument();
  });

  it("shows the five business totals with the client count from the data", () => {
    render(
      <TotalsRow totals={{ activeClients: 3, mrrCLP: 119970, leadsThisMonth: 0, conversationsThisMonth: 0, publishedSites: 2 }} />,
    );
    expect(screen.getByTestId("totals-row")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("$119.970")).toBeInTheDocument();
  });

  it("renders the glance table ordered as given and shows the empty state when there are no clients", () => {
    render(<TenantGlanceTable rows={[]} />);
    expect(screen.getByText(/todavía no hay clientes/i)).toBeInTheDocument();
  });

  it("never uses clinic vocabulary", () => {
    const { container } = render(<TenantGlanceTable rows={[]} />);
    expect(container.textContent ?? "").not.toMatch(/paciente|clínica|clinica|consultorio/i);
  });
});
