import { DollarSign, Globe, Inbox, MessageSquare, Users } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { PanelTotals } from "@/lib/panel/aicore-overview";
import { formatCLP } from "@/lib/marketing/copy";

export interface TotalsRowProps {
  totals: PanelTotals;
}

/** The totals block of the design (§6). Every number comes from the database. */
export function TotalsRow({ totals }: TotalsRowProps) {
  return (
    <section data-testid="totals-row" aria-labelledby="totals-row-title">
      <h2 id="totals-row-title" className="text-lg font-semibold text-navy">
        Resumen del negocio
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Clientes activos" value={totals.activeClients} icon={Users} tone="brand" />
        <StatCard
          label="MRR"
          value={formatCLP(totals.mrrCLP)}
          icon={DollarSign}
          tone="teal"
          hint="Precios de lista, IVA aparte"
        />
        <StatCard label="Leads del mes" value={totals.leadsThisMonth} icon={Inbox} />
        <StatCard
          label="Conversaciones del mes"
          value={totals.conversationsThisMonth}
          icon={MessageSquare}
        />
        <StatCard label="Sitios publicados" value={totals.publishedSites} icon={Globe} />
      </div>
    </section>
  );
}
