import Link from "next/link";
import { asAdmin } from "@/lib/tenant-context";

// Esta pagina consulta la base de datos por tenant en cada request -nunca
// debe pre-renderizarse como pagina estatica en build time (ademas de que
// durante el build de Docker no hay conexion real a la base de datos).
export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await asAdmin((tx) =>
    tx.tenant.findMany({ orderBy: { createdAt: "desc" } })
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Tenants</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-slate-500">{t.slug}</td>
                <td className="px-4 py-3">{t.plan}</td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3">
                  <Link href={`/tenants/${t.id}`} className="text-brand hover:underline">
                    Administrar
                  </Link>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Aun no hay tenants. Crea uno directamente en la base de datos para empezar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
