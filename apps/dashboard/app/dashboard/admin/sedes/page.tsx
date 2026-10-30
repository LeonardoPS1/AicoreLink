"use client";

import { useEffect, useState } from "react";

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
}

export default function SedesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((tenants) => {
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tid = tenants[0].id;
          setTenantId(tid);
          fetch(`/api/tenants/${tid}/branches`)
            .then((r) => r.json())
            .then((d) => {
              setBranches(Array.isArray(d) ? d : []);
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
    const res = await fetch(`/api/tenants/${tenantId}/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setBranches([...branches, created]);
      setShowForm(false);
      setForm({ name: "", address: "", phone: "" });
    }
  };

  const handleToggle = async (branch: Branch) => {
    if (!tenantId) return;
    const res = await fetch(`/api/tenants/${tenantId}/branches/${branch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !branch.active }),
    });
    if (res.ok) {
      setBranches(branches.map((b) => (b.id === branch.id ? { ...b, active: !b.active } : b)));
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Multi-sede</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancelar" : "Agregar sede"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
          <input
            placeholder="Nombre de la sede"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button onClick={handleCreate} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white">
            Guardar sede
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-navy">{branch.name}</h3>
              <button
                onClick={() => handleToggle(branch)}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${branch.active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}`}
              >
                {branch.active ? "Activa" : "Inactiva"}
              </button>
            </div>
            {branch.address && <p className="text-sm text-slate-500">{branch.address}</p>}
            {branch.phone && <p className="text-sm text-slate-500">{branch.phone}</p>}
          </div>
        ))}
        {branches.length === 0 && (
          <p className="text-center text-slate-400 col-span-full py-8">No hay sedes registradas.</p>
        )}
      </div>
    </div>
  );
}
