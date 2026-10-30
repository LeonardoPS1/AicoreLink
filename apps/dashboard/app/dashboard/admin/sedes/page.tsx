"use client";

import { useState, useEffect } from "react";

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  // Get tenantId from session - for now use a placeholder
  const tenantId = "default";

  useEffect(() => {
    fetch(`/api/tenants/${tenantId}/branches`)
      .then((r) => r.json())
      .then((data) => {
        setBranches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId]);

  const handleCreate = async () => {
    const res = await fetch(`/api/tenants/${tenantId}/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newBranch = await res.json();
      setBranches([...branches, newBranch]);
      setShowForm(false);
      setForm({ name: "", address: "", phone: "" });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Multi-sede</h1>

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {showForm ? "Cancelar" : "Agregar sede"}
      </button>

      {showForm && (
        <div className="mb-6 border rounded p-4 space-y-3">
          <input
            placeholder="Nombre de la sede"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
          <input
            placeholder="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
          <input
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
          <button
            onClick={handleCreate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Crear sede
          </button>
        </div>
      )}

      <div className="space-y-3">
        {branches.map((b) => (
          <div key={b.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{b.name}</h3>
              <p className="text-sm text-slate-600">{b.address ?? "Sin dirección"}</p>
              <p className="text-sm text-slate-500">{b.phone ?? "Sin teléfono"}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${b.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {b.active ? "Activa" : "Inactiva"}
            </span>
          </div>
        ))}
        {branches.length === 0 && (
          <p className="text-center text-slate-500">No hay sedes registradas.</p>
        )}
      </div>
    </div>
  );
}