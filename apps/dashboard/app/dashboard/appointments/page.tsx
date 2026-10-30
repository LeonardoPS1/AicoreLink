import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface Appointment {
  id: string;
  scheduledAt: string | Date;
  status: string;
  notes?: string | null;
}

async function loadAppointments(): Promise<Appointment[]> {
  // Prefer the public API so the page stays a thin consumer of /api/tenants/appointments.
  try {
    const res = await fetch("/api/tenants/appointments", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data as Appointment[];
      if (Array.isArray(data?.appointments)) return data.appointments as Appointment[];
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
      const appointments = await withTenant(tenantId, async (tx: any) => {
        return tx.appointment.findMany({ orderBy: { scheduledAt: "asc" }, take: 50 });
      });
      if (Array.isArray(appointments)) return appointments as Appointment[];
    }
  } catch {
    // ignore
  }

  return [];
}

function formatDate(value: string | Date): string {
  try {
    return new Date(value).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

export default async function AppointmentsPage() {
  const appointments = await loadAppointments();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">Citas</h1>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Notas</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  {formatDate(appointment.scheduledAt)}
                  <span className="sr-only">{new Date(appointment.scheduledAt).toISOString()}</span>
                </td>
                <td className="px-4 py-3">{appointment.status}</td>
                <td className="px-4 py-3 text-slate-500">{appointment.notes ?? "Sin notas"}</td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Aún no hay citas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}