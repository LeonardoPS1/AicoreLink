import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTenantChannels } from "@/lib/entitlements";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId as string;

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  const channels = await getTenantChannels(tenantId);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">Bienvenido, {tenant?.name}</h1>
      <p className="mb-6 text-sm text-slate-500">Plan actual: {tenant?.plan}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["whatsapp_text", "whatsapp_voice", "email", "social"] as const).map((ch) => {
          const found = channels.find((c) => c.channel === ch);
          const enabled = found?.enabled ?? false;
          return (
            <div key={ch} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase text-slate-400">{ch.replace("_", " ")}</p>
              <p className={`mt-2 text-sm font-semibold ${enabled ? "text-teal" : "text-slate-400"}`}>
                {enabled ? "Activo" : "No contratado"}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-sm text-slate-400">
        Las metricas de uso apareceran aqui una vez que actives tu primer canal (Fase 1 en adelante).
      </p>
    </div>
  );
}
