import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { asAdmin } from "@/lib/tenant-context";
import { setFeature, CHANNELS, type Channel } from "@/lib/entitlements";
import { revalidatePath } from "next/cache";

async function toggleChannel(tenantId: string, channel: Channel, enabled: boolean) {
  "use server";
  const session = await getServerSession(authOptions);
  const actorId = (session?.user as any)?.id ?? "admin-desconocido";

  await setFeature(tenantId, channel, enabled, actorId);
  revalidatePath(`/dashboard/admin/tenants/${tenantId}`);
}

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const tenant = await asAdmin((tx) =>
    tx.tenant.findUnique({
      where: { id: params.id },
      include: { channels: true },
    })
  );

  if (!tenant) {
    return <p className="text-sm text-red-600">Tenant no encontrado.</p>;
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">{tenant.name}</h1>
      <p className="mb-6 text-sm text-slate-500">
        Plan: {tenant.plan} · Estado: {tenant.status}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CHANNELS.map((channel) => {
          const current = tenant.channels.find((c) => c.channel === channel);
          const enabled = current?.enabled ?? false;

          return (
            <form
              key={channel}
              action={toggleChannel.bind(null, tenant.id, channel, !enabled)}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium capitalize">{channel.replace("_", " ")}</p>
                <p className={`text-xs ${enabled ? "text-teal" : "text-slate-400"}`}>
                  {enabled ? "Activo" : "Desactivado"}
                </p>
              </div>
              <button
                type="submit"
                className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
                  enabled ? "bg-red-500 hover:bg-red-600" : "bg-teal hover:bg-teal-700"
                }`}
              >
                {enabled ? "Desactivar" : "Activar"}
              </button>
            </form>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Nota: activar whatsapp_voice requiere que whatsapp_text ya este activo para este tenant.
        Cada cambio queda registrado en audit_log.
      </p>
    </div>
  );
}
