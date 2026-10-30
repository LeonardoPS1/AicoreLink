"use client";

import { useEffect, useState } from "react";

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  status: string;
  createdAt?: string;
}

const STATUSES = ["nuevo", "contactado", "calificado", "propuesta", "ganado", "perdido"];
const STATUS_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  calificado: "Calificado",
  propuesta: "Propuesta",
  ganado: "Ganado",
  perdido: "Perdido",
};
const STATUS_COLORS: Record<string, string> = {
  nuevo: "bg-blue-100 text-blue-800",
  contactado: "bg-yellow-100 text-yellow-800",
  calificado: "bg-purple-100 text-purple-800",
  propuesta: "bg-orange-100 text-orange-800",
  ganado: "bg-green-100 text-green-800",
  perdido: "bg-red-100 text-red-800",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [view, setView] = useState<"kanban" | "table">("kanban");

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((tenants) => {
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tid = tenants[0].id;
          setTenantId(tid);
          fetch(`/api/tenants/leads?tenantId=${tid}`)
            .then((r) => r.json())
            .then((d) => {
              setLeads(d.leads ?? []);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const moveLead = async (leadId: string, newStatus: string) => {
    if (!tenantId) return;
    // Update local state immediately
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    // Persist via API
    try {
      await fetch(`/api/tenants/${tenantId}/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Revert on error
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: leads.find((x) => x.id === leadId)?.status ?? "nuevo" } : l))
      );
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Leads</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("kanban")}
            className={`rounded-lg px-3 py-1.5 text-sm ${view === "kanban" ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView("table")}
            className={`rounded-lg px-3 py-1.5 text-sm ${view === "table" ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Tabla
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <div
              key={status}
              className="min-w-[250px] flex-shrink-0 rounded-lg bg-slate-100 p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const leadId = e.dataTransfer.getData("leadId");
                if (leadId) moveLead(leadId, status);
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">{STATUS_LABELS[status]}</h3>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                  {leads.filter((l) => l.status === status).length}
                </span>
              </div>
              <div className="space-y-2">
                {leads
                  .filter((l) => l.status === status)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-lg bg-white p-3 shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("leadId", lead.id)}
                    >
                      <p className="font-medium text-sm">{lead.name}</p>
                      {lead.email && <p className="text-xs text-slate-500">{lead.email}</p>}
                      {lead.phone && <p className="text-xs text-slate-500">{lead.phone}</p>}
                      <p className="text-xs text-slate-400 mt-1">{lead.source}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Fuente</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3 text-slate-500">{lead.source}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[lead.status] ?? "bg-slate-100"}`}>
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Aún no hay leads.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
