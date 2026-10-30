"use client";

import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt: string | null;
}

export default function SoportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "normal" });
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((tenants) => {
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tid = tenants[0].id;
          setTenantId(tid);
          fetch(`/api/tenants/${tid}/support`)
            .then((r) => r.json())
            .then((d) => { setTickets(Array.isArray(d) ? d : []); setLoading(false); });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!tenantId) return;
    setSubmitting(true);
    const res = await fetch(`/api/tenants/${tenantId}/support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setTickets([created, ...tickets]);
      setShowForm(false);
      setForm({ subject: "", description: "", priority: "normal" });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  const statusColor: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-slate-100 text-slate-600",
  };

  const priorityColor: Record<string, string> = {
    low: "text-slate-500",
    normal: "text-slate-700",
    high: "text-orange-600",
    urgent: "text-red-600 font-bold",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Soporte</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancelar" : "Nuevo ticket"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
          <input
            placeholder="Asunto"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Descripción del problema"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={4}
          />
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Crear ticket"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{t.subject}</h3>
              <div className="flex gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[t.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {t.status}
                </span>
                <span className={`text-xs ${priorityColor[t.priority] ?? ""}`}>
                  {t.priority}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600">{t.description}</p>
            <p className="mt-2 text-xs text-slate-400">
              Creado: {new Date(t.createdAt).toLocaleDateString("es-CL")}
              {t.resolvedAt && ` · Resuelto: ${new Date(t.resolvedAt).toLocaleDateString("es-CL")}`}
            </p>
          </div>
        ))}
        {tickets.length === 0 && (
          <p className="text-center text-slate-400">No hay tickets de soporte.</p>
        )}
      </div>
    </div>
  );
}