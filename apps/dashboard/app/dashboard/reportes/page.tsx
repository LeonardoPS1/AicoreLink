"use client";

import { useEffect, useState } from "react";

export default function ReportesPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((tenants) => {
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tid = tenants[0].id;
          fetch(`/api/tenants/${tid}/reports?period=${period}`)
            .then((r) => r.json())
            .then((d) => { setReport(d); setLoading(false); });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="p-6">Cargando...</div>;

  if (!report) return <div className="p-6">No se pudieron cargar los reportes.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Reportes</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
        </select>
      </div>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Leads</p>
          <p className="mt-1 text-2xl font-bold text-navy">{report.leads?.total ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Conversaciones</p>
          <p className="mt-1 text-2xl font-bold text-navy">{report.conversations?.total ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Citas</p>
          <p className="mt-1 text-2xl font-bold text-navy">{report.appointments?.total ?? 0}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Conversión</p>
          <p className="mt-1 text-2xl font-bold text-navy">{report.conversionRate ?? "0%"}</p>
        </div>
      </section>

      {/* Usage */}
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Uso</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-slate-500">Mensajes totales</p>
            <p className="mt-1 text-xl font-bold text-navy">{report.usage?.totalMessages ?? 0}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Tokens usados</p>
            <p className="mt-1 text-xl font-bold text-navy">{report.usage?.totalTokens ?? 0}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Costo estimado</p>
            <p className="mt-1 text-xl font-bold text-navy">${(report.usage?.totalCost ?? 0).toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* Leads by status */}
      {report.leads?.byStatus && Object.keys(report.leads.byStatus).length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Leads por estado</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(report.leads.byStatus).map(([status, count]) => (
              <div key={status} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
                <span className="font-medium">{status}</span>: {count as number}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Appointments by status */}
      {report.appointments?.byStatus && Object.keys(report.appointments.byStatus).length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Citas por estado</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(report.appointments.byStatus).map(([status, count]) => (
              <div key={status} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
                <span className="font-medium">{status}</span>: {count as number}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}