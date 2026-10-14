import { asAdmin } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

async function getCostRates() {
  return asAdmin((tx) =>
    tx.costRate.findMany({ orderBy: [{ provider: "asc" }, { unit: "asc" }] })
  );
}

async function getTenantsWithUsage() {
  return asAdmin(async (tx) => {
    const tenants = await tx.tenant.findMany({
      include: {
        usage: { orderBy: { period: "desc" } },
        channels: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const rates = await tx.costRate.findMany();

    return tenants.map((t) => {
      const totalCost = t.usage.reduce((sum, u) => sum + Number(u.costEstimate || 0), 0);
      const totalTokens = t.usage.reduce((sum, u) => sum + (u.tokensUsed || 0), 0);
      const totalMessagesIn = t.usage.reduce((sum, u) => sum + (u.messagesIn || 0), 0);
      const totalMessagesOut = t.usage.reduce((sum, u) => sum + (u.messagesOut || 0), 0);

      return {
        ...t,
        totalCost,
        totalTokens,
        totalMessagesIn,
        totalMessagesOut,
        activeChannels: t.channels.filter((c) => c.enabled).map((c) => c.channel),
      };
    });
  });
}

export default async function MetricasPage() {
  const [tenants, costRates] = await Promise.all([
    getTenantsWithUsage(),
    getCostRates(),
  ]);

  const planPrices: Record<string, number> = {
    basico: 29,
    profesional: 79,
    enterprise: 199,
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Metricas y Costos</h1>

      <div className="mb-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3 text-right">Precio Plan (USD/mes)</th>
              <th className="px-4 py-3 text-right">Costo Real (USD)</th>
              <th className="px-4 py-3 text-right">Margen (USD)</th>
              <th className="px-4 py-3 text-right">Margen (%)</th>
              <th className="px-4 py-3 text-right">Tokens</th>
              <th className="px-4 py-3 text-right">Msg In/Out</th>
              <th className="px-4 py-3">Canales Activos</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const planPrice = planPrices[t.plan] || 0;
              const margin = planPrice - t.totalCost;
              const marginPct = planPrice > 0 ? ((margin / planPrice) * 100).toFixed(1) : "N/A";

              return (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize">{t.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-right">${planPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    ${t.totalCost.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    ${margin.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {marginPct !== "N/A" ? (
                      <span
                        className={`font-semibold ${
                          margin >= 0 ? "text-teal" : "text-red-600"
                        }`}
                      >
                        {marginPct}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {t.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {t.totalMessagesIn} / {t.totalMessagesOut}
                  </td>
                  <td className="px-4 py-3">
                    {t.activeChannels.length > 0 ? (
                      <span className="text-teal text-sm">
                        {t.activeChannels.join(", ")}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">Ninguno</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                  No hay tenants registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <h2 className="px-4 py-3 text-sm font-semibold text-slate-900 border-b border-slate-200">
          Tarifas de Costos (CostRates)
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3 text-right">Tarifa (USD)</th>
            </tr>
          </thead>
          <tbody>
            {costRates.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{r.provider}</td>
                <td className="px-4 py-3">{r.unit}</td>
                <td className="px-4 py-3 text-right font-mono">
                  ${Number(r.rate).toFixed(6)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}