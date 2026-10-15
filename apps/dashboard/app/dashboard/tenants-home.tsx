import { AlertList } from "@/components/dashboard/panel/alert-list";
import { HealthStrip } from "@/components/dashboard/panel/health-strip";
import { TenantGlanceTable } from "@/components/dashboard/panel/tenant-glance-table";
import { TotalsRow } from "@/components/dashboard/panel/totals-row";
import { getSystemHealth } from "@/lib/panel/health";
import { getAlerts, getTenantGlance, getTotals } from "@/lib/panel/aicore-overview";

/**
 * Main menu of the Aicore panel (§6), in the order of the design: the health of
 * the system, the active alerts, the business totals and the per-client glance.
 * Every number is read from the database through the staff connection; nothing is
 * hardcoded, and an empty table shows an honest empty state instead of a zero.
 */
export async function TenantsHome() {
  const [health, totals, alerts, rows] = await Promise.all([
    getSystemHealth(),
    getTotals(),
    getAlerts(),
    getTenantGlance(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-navy">Menú principal</h1>
      <HealthStrip health={health} />
      <AlertList alerts={alerts} />
      <TotalsRow totals={totals} />
      <TenantGlanceTable rows={rows} />
    </div>
  );
}
