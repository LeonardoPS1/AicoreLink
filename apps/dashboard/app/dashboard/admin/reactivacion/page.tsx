"use client";

import { useEffect, useState } from "react";

interface Campaign {
  id: string;
  name: string;
  audience: string;
  message: string;
  scheduledAt: string | null;
  status: string | null;
  createdAt: string;
}

export default function ReactivationPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", audience: "all", message: "", scheduledAt: "" });
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((tenants) => {
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tid = tenants[0].id;
          setTenantId(tid);
          fetch(`/api/tenants/${tid}/reactivation`)
            .then((r) => r.json())
            .then((d) => {
              setCampaigns(Array.isArray(d) ? d : []);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!tenantId) return;
    const res = await fetch(`/api/tenants/${tenantId}/reactivation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setCampaigns([created, ...campaigns]);
      setShowForm(false);
      setForm({ name: "", audience: "all", message: "", scheduledAt: "" });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Reactivación con IA</h1>
          <p className="text-sm text-slate-500 mt-1">
            Campañas para reactivar clientes inactivos
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancelar" : "Nueva campaña"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
          <input
            placeholder="Nombre de la campaña"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Todos los clientes</option>
            <option value="inactive_30">Inactivos 30+ días</option>
            <option value="inactive_60">Inactivos 60+ días</option>
            <option value="inactive_90">Inactivos 90+ días</option>
          </select>
          <textarea
            placeholder="Mensaje de reactivación"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={4}
          />
          <input
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button onClick={handleCreate} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white">
            Crear campaña
          </button>
        </div>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-navy">{c.name}</h3>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                {c.audience}
              </span>
            </div>
            <p className="text-sm text-slate-600">{c.message}</p>
            {c.scheduledAt && (
              <p className="mt-2 text-xs text-slate-400">
                Programada: {new Date(c.scheduledAt).toLocaleString("es-CL")}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              Creada: {new Date(c.createdAt).toLocaleDateString("es-CL")}
            </p>
          </div>
        ))}
        {campaigns.length === 0 && (
          <p className="text-center text-slate-400 py-8">No hay campañas de reactivación.</p>
        )}
      </div>
    </div>
  );
}
