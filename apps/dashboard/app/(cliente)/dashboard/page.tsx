import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantChannels } from "@/lib/entitlements";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getTenantMetrics(tx: any, tenantId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const usage = await tx.tenantUsage.findMany({
    where: {
      tenantId,
      period: { gte: startOfMonth },
    },
    orderBy: { period: "desc" },
  });

  const totalMessagesIn = usage.reduce((sum: number, u: any) => sum + (u.messagesIn || 0), 0);
  const totalMessagesOut = usage.reduce((sum: number, u: any) => sum + (u.messagesOut || 0), 0);
  const totalTokens = usage.reduce((sum: number, u: any) => sum + (u.tokensUsed || 0), 0);
  const totalCost = usage.reduce((sum: number, u: any) => sum + Number(u.costEstimate || 0), 0);

  const byChannel = usage.reduce((acc: Record<string, any>, u: any) => {
    if (!acc[u.channel]) {
      acc[u.channel] = { messagesIn: 0, messagesOut: 0, tokensUsed: 0, costEstimate: 0 };
    }
    acc[u.channel].messagesIn += u.messagesIn || 0;
    acc[u.channel].messagesOut += u.messagesOut || 0;
    acc[u.channel].tokensUsed += u.tokensUsed || 0;
    acc[u.channel].costEstimate += Number(u.costEstimate || 0);
    return acc;
  }, {});

  return {
    totalMessagesIn,
    totalMessagesOut,
    totalTokens,
    totalCost,
    byChannel,
    hasData: usage.length > 0,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId as string;

  const { tenant, channels, metrics } = await withTenant(tenantId, async (tx) => {
    const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
    const channels = await getTenantChannels(tenantId, tx);
    const metrics = await getTenantMetrics(tx, tenantId);
    return { tenant, channels, metrics };
  });

  const activeChannels = channels.filter((c: any) => c.enabled).map((c: any) => c.channel);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">Bienvenido, {tenant?.name}</h1>
      <p className="mb-6 text-sm text-slate-500">Plan actual: {tenant?.plan}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["whatsapp_text", "whatsapp_voice", "email", "social"] as const).map((ch) => {
          const found = channels.find((c: { channel: string; enabled: boolean }) => c.channel === ch);
          const enabled = found?.enabled ?? false;
          const channelMetrics = metrics.byChannel[ch];
          return (
            <div key={ch} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-400">{ch.replace("_", " ")}</p>
              <p className={`mt-2 text-sm font-semibold ${enabled ? "text-teal" : "text-slate-400"}`}>
                {enabled ? "Activo" : "No contratado"}
              </p>
              {enabled && channelMetrics && (
                <div className="mt-2 text-xs text-slate-500 space-y-1">
                  <span>Msg: {channelMetrics.messagesIn} in / {channelMetrics.messagesOut} out</span>
                  <span>Tokens: {channelMetrics.tokensUsed}</span>
                  <span>Costo: ${channelMetrics.costEstimate.toFixed(4)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {metrics.hasData ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <h2 className="px-4 py-3 text-sm font-semibold text-slate-900 border-b border-slate-200">
            Resumen del Mes Actual
          </h2>
          <div className="p-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-400">Mensajes Entrantes</p>
              <p className="mt-1 text-2xl font-bold text-navy">{metrics.totalMessagesIn}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-400">Mensajes Salientes</p>
              <p className="mt-1 text-2xl font-bold text-teal">{metrics.totalMessagesOut}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-400">Tokens Usados</p>
              <p className="mt-1 text-2xl font-bold text-brand">{metrics.totalTokens.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-400">Costo Estimado</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">${metrics.totalCost.toFixed(4)}</p>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-slate-200">
            <h3 className="text-xs uppercase text-slate-400 mb-2">Por Canal</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(metrics.byChannel).map(([channel, data]: [string, any]) => (
                <div key={channel} className="rounded-lg bg-slate-50 p-3 text-xs">
                  <p className="font-medium capitalize">{channel.replace("_", " ")}</p>
                  <p className="text-slate-500">
                    {data.messagesIn} in / {data.messagesOut} out · {data.tokensUsed} tokens · ${data.costEstimate.toFixed(4)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeChannels.length > 0 ? (
        <p className="mt-10 text-sm text-slate-400">
          Las metricas de uso apareceran aqui una vez que el canal procese sus primeros mensajes.
        </p>
      ) : (
        <p className="mt-10 text-sm text-slate-400">
          Las metricas de uso apareceran aqui una vez que actives tu primer canal.
        </p>
      )}
    </div>
  );
}