import { asAdmin } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

type WorkerStatus = "healthy" | "unhealthy" | "down" | "error";

interface WorkerHealth {
  name: string;
  type: string;
  port: number;
  status: WorkerStatus;
  lastCheck: string;
  details?: any;
  error?: string;
}

const WORKERS: Omit<WorkerHealth, "status" | "lastCheck" | "details" | "error">[] = [
  { name: "whatsapp-worker", type: "WhatsApp", port: 3001 },
  { name: "email-worker", type: "Email", port: 3002 },
  { name: "social-worker", type: "RRSS", port: 3003 },
  { name: "whisper", type: "Whisper ASR", port: 9000 },
  { name: "monitor", type: "Monitor/Alerts", port: 3004 },
];

async function getWorkerHealth(): Promise<WorkerHealth[]> {
  const results = await Promise.allSettled(
    WORKERS.map(async (w) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`http://${w.name}:${w.port}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          return { ...w, status: "healthy" as WorkerStatus, lastCheck: new Date().toISOString(), details: data } as WorkerHealth;
        }
        return { ...w, status: "unhealthy" as WorkerStatus, lastCheck: new Date().toISOString(), error: `HTTP ${res.status}` } as WorkerHealth;
      } catch (error) {
        return {
          ...w,
          status: "down" as WorkerStatus,
          lastCheck: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Timeout/Connection refused",
        } as WorkerHealth;
      }
    })
  );

  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : ({ ...WORKERS[0], status: "error" as WorkerStatus, lastCheck: new Date().toISOString(), error: String(r.reason) } as WorkerHealth)
  );
}

async function getRecentErrors() {
  return asAdmin((tx) =>
    tx.auditLog.findMany({
      where: { action: { contains: "error" } },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
  );
}

export default async function InfraestructuraPage() {
  const [workers, errors] = await Promise.all([getWorkerHealth(), getRecentErrors()]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Infraestructura y Salud</h1>

      <div className="mb-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <h2 className="px-4 py-3 text-sm font-semibold text-slate-900 border-b border-slate-200">
          Estado de Workers
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Worker</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Puerto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Ultima Verificacion</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.name} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium font-mono text-xs">{w.name}</td>
                <td className="px-4 py-3">{w.type}</td>
                <td className="px-4 py-3 font-mono text-xs">{w.port}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      w.status === "healthy"
                        ? "bg-green-100 text-green-800"
                        : w.status === "unhealthy"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {w.status === "healthy" ? "Saludable" : w.status === "unhealthy" ? "Degradado" : "Caido"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {w.lastCheck ? new Date(w.lastCheck).toLocaleString("es-CL") : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {w.error || (w.details ? JSON.stringify(w.details).slice(0, 80) : "OK")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <h2 className="px-4 py-3 text-sm font-semibold text-slate-900 border-b border-slate-200">
          Errores Recientes (Audit Log)
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Accion</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {errors.length > 0 ? (
              errors.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-xs">
                    {new Date(e.createdAt).toLocaleString("es-CL")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{e.tenantId || "global"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{e.actorId || "system"}</td>
                  <td className="px-4 py-3 text-red-600">{e.action}</td>
                  <td className="px-4 py-3 text-xs max-w-xs truncate">
                    {JSON.stringify(e.meta)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No hay errores recientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}