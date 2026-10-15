import { Users } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { TenantGlanceRow } from "@/lib/panel/aicore-overview";
import type { RiskLevel } from "@/lib/panel/risk";

const DATE_TIME = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

const RISK: Record<RiskLevel, { label: string; variant: BadgeVariant; className?: string }> = {
  alto: { label: "alto", variant: "neutral", className: "bg-red-100 text-red-700" },
  medio: { label: "medio", variant: "amber" },
  bajo: { label: "bajo", variant: "teal" },
};

const CHANNEL: Record<TenantGlanceRow["channelHealth"], { label: string; variant: BadgeVariant }> = {
  activo: { label: "activo", variant: "teal" },
  deshabilitado: { label: "deshabilitado", variant: "amber" },
  sin_canal: { label: "sin canal", variant: "neutral" },
};

const SITE: Record<string, { label: string; variant: BadgeVariant }> = {
  published: { label: "publicado", variant: "teal" },
  approved: { label: "aprobado", variant: "brand" },
  review: { label: "en revisión", variant: "amber" },
  generating: { label: "generando", variant: "amber" },
  draft: { label: "borrador", variant: "amber" },
  unpublished: { label: "despublicado", variant: "neutral" },
};

export interface TenantGlanceTableProps {
  rows: TenantGlanceRow[];
}

/**
 * One row per client (§6), already ordered by risk. The table scrolls inside its
 * own container so a phone never gets a page-wide horizontal scrollbar.
 */
export function TenantGlanceTable({ rows }: TenantGlanceTableProps) {
  return (
    <section data-testid="tenant-glance-table" aria-labelledby="tenant-glance-title">
      <h2 id="tenant-glance-title" className="text-lg font-semibold text-navy">
        Vistazo por cliente
      </h2>
      {rows.length === 0 ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white">
          <EmptyState
            icon={Users}
            title="Todavía no hay clientes"
            description="Cuando se sume el primer cliente, aquí verás su uso del mes, la salud de su sitio y su nivel de riesgo."
          />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Cliente</th>
                <th scope="col" className="px-4 py-3 font-medium">Plan</th>
                <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                <th scope="col" className="px-4 py-3 font-medium">Uso del mes</th>
                <th scope="col" className="px-4 py-3 font-medium">Sitio</th>
                <th scope="col" className="px-4 py-3 font-medium">Canal</th>
                <th scope="col" className="px-4 py-3 font-medium">Último mensaje</th>
                <th scope="col" className="px-4 py-3 font-medium">Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const risk = RISK[row.risk];
                const channel = CHANNEL[row.channelHealth];
                const site = row.siteStatus ? SITE[row.siteStatus] : undefined;
                const percent = Math.round(row.usageRatio * 100);
                return (
                  <tr key={row.tenantId}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.planLabel}</td>
                    <td className="px-4 py-3 text-slate-600">{row.status}</td>
                    <td className="px-4 py-3">
                      <span className="tabular-nums text-slate-900">
                        {row.usageThisMonth} / {row.usageLimit}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">{percent}%</span>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
                        <div
                          className={percent >= 100 ? "h-full bg-red-500" : percent >= 80 ? "h-full bg-amber-500" : "h-full bg-teal"}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {site ? (
                        <Badge variant={site.variant}>{site.label}</Badge>
                      ) : (
                        <Badge variant="neutral">sin sitio</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={channel.variant}>{channel.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.lastMessageAt ? (
                        <time dateTime={row.lastMessageAt}>
                          {DATE_TIME.format(new Date(row.lastMessageAt))}
                        </time>
                      ) : (
                        <span className="text-slate-400">Sin registro</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={risk.variant} className={risk.className}>
                        {risk.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
