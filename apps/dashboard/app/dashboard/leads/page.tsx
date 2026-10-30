import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  status: string;
  createdAt?: string;
}

async function loadLeads(): Promise<Lead[]> {
  // Prefer the public API so the page stays a thin consumer of /api/tenants/leads.
  try {
    const res = await fetch("/api/tenants/leads", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as Lead[];
      if (Array.isArray(data?.leads)) return data.leads as Lead[];
    }
  } catch {
    // fall through to direct DB access
  }

  // Fallback: read directly with the tenant context (works in tests that mock
  // tenant-context instead of fetch, and avoids an extra HTTP hop in prod).
  try {
    const { withTenant } = await import("@/lib/tenant-context");
    const session = await getServerSession(authOptions);
    const tenantId = (session?.user as { tenantId?: string | null } | undefined)?.tenantId;
    if (tenantId) {
      const leads = await withTenant(tenantId, async (tx: any) => {
        return tx.lead.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
      });
      if (Array.isArray(leads)) return leads as Lead[];
    }
  } catch {
    // ignore
  }

  return [];
}

function utmLabel(lead: Lead): string {
  const parts = [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean);
  return parts.length ? parts.join(" / ") : "—";
}

export default async function LeadsPage() {
  const leads = await loadLeads();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Leads</h1>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">UTM</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{lead.name}</td>
                <td className="px-4 py-3 text-slate-500">{lead.source}</td>
                <td className="px-4 py-3 text-slate-500">{utmLabel(lead)}</td>
                <td className="px-4 py-3">{lead.status}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Aún no hay leads.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}