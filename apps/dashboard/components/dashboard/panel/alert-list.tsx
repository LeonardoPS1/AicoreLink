import { BellOff } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { AlertKind, PanelAlert } from "@/lib/panel/aicore-overview";

const DATE_TIME = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

const SEVERITY: Record<PanelAlert["severity"], { label: string; variant: BadgeVariant; className?: string }> = {
  alta: { label: "alta", variant: "neutral", className: "bg-red-100 text-red-700" },
  media: { label: "media", variant: "amber" },
  baja: { label: "baja", variant: "neutral" },
};

const KIND_LABELS: Record<AlertKind, string> = {
  publish_failed: "Publicación fallida",
  channel_disabled: "Canal deshabilitado",
  tenant_idle: "Cliente sin actividad",
  usage_over_limit: "Uso del mes",
};

export interface AlertListProps {
  alerts: PanelAlert[];
}

export function AlertList({ alerts }: AlertListProps) {
  return (
    <section data-testid="alert-list" aria-labelledby="alert-list-title">
      <h2 id="alert-list-title" className="text-lg font-semibold text-navy">
        Alertas activas
      </h2>
      {alerts.length === 0 ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white">
          <EmptyState
            icon={BellOff}
            title="Sin alertas activas"
            description="No hay publicaciones fallidas, canales apagados ni clientes sin actividad."
          />
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {alerts.map((alert) => {
            const severity = SEVERITY[alert.severity];
            return (
              <li key={alert.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-4">
                <Badge variant={severity.variant} className={severity.className}>
                  {severity.label}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{KIND_LABELS[alert.kind]}</p>
                  <p className="text-sm">
                    <span className="font-medium text-slate-700">
                      {alert.tenantName ?? "Sin cliente asociado"}
                    </span>{" "}
                    <span className="text-slate-500">{alert.detail}</span>
                  </p>
                </div>
                {alert.at ? (
                  <time className="text-xs text-slate-400" dateTime={alert.at}>
                    {DATE_TIME.format(new Date(alert.at))}
                  </time>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
