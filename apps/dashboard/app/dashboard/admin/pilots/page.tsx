"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PilotMetric {
  messages: number;
  cost: number;
  leads: number;
  appointments: number;
}

interface PilotFollowup {
  day: number;
  sentAt: string | null;
  respondedAt: string | null;
  score: number | null;
}

interface Pilot {
  id: string;
  tenantId: string;
  tenantName: string;
  plan: string;
  status: string;
  founderAgreement: boolean;
  checklist: Record<string, boolean>;
  assignedTo: string | null;
  startedAt: string;
  completedAt: string | null;
  daysSinceStart: number;
  metrics: PilotMetric;
  followups: PilotFollowup[];
}

export default function PilotsPage() {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetch("/api/admin/pilots")
      .then((r) => r.json())
      .then((data) => setPilots(Array.isArray(data) ? data : []))
      .catch(() => setPilots([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filterStatus === "all"
      ? pilots
      : pilots.filter((p) => p.status === filterStatus);

  if (loading) {
    return <div className="text-slate-500">Cargando pilotos...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Pilotos</h1>
        <Link
          href="/dashboard/admin/pilots/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo Piloto
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {["all", "pending", "in_progress", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              filterStatus === s
                ? "bg-brand text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s === "all" ? "Todos" : s === "pending" ? "Pendiente" : s === "in_progress" ? "En progreso" : "Completado"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3">Dias</th>
              <th className="px-4 py-3">Msgs</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Leads</th>
              <th className="px-4 py-3">Citas</th>
              <th className="px-4 py-3">Seguimiento</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{p.tenantName}</td>
                <td className="px-4 py-3">{p.plan}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(p.startedAt).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3">{p.daysSinceStart}</td>
                <td className="px-4 py-3">{p.metrics.messages}</td>
                <td className="px-4 py-3">${p.metrics.cost.toFixed(2)}</td>
                <td className="px-4 py-3">{p.metrics.leads}</td>
                <td className="px-4 py-3">{p.metrics.appointments}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {[1, 7, 14, 30].map((day) => {
                      const fu = p.followups.find((f) => f.day === day);
                      const sent = !!fu?.sentAt;
                      const responded = !!fu?.respondedAt;
                      return (
                        <span
                          key={day}
                          className={`inline-block h-5 w-5 rounded text-center text-[10px] leading-5 ${
                            responded
                              ? "bg-green-500 text-white"
                              : sent
                              ? "bg-yellow-400 text-white"
                              : "bg-slate-200 text-slate-400"
                          }`}
                          title={`d${day}: ${responded ? "respondido" : sent ? "enviado" : "pendiente"}`}
                        >
                          {day}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : p.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-400">
                  Aun no hay pilotos. Crea uno con &quot;Nuevo Piloto&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}