"use client";

import { useEffect, useState } from "react";

interface Correction {
  id: string;
  original: string;
  correction: string;
  context: string | null;
  createdAt: string;
}

export default function LearningModePage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ original: "", correction: "", context: "" });
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((tenants) => {
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tid = tenants[0].id;
          setTenantId(tid);
          fetch(`/api/tenants/${tid}/corrections`)
            .then((r) => r.json())
            .then((d) => {
              setCorrections(Array.isArray(d) ? d : []);
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
    const res = await fetch(`/api/tenants/${tenantId}/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setCorrections([created, ...corrections]);
      setShowForm(false);
      setForm({ original: "", correction: "", context: "" });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Modo Aprendizaje</h1>
          <p className="text-sm text-slate-500 mt-1">
            Correcciones del dueño que mejoran las respuestas del asistente
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancelar" : "Agregar corrección"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Respuesta original del asistente</label>
            <textarea
              placeholder="Lo que dijo el asistente originalmente"
              value={form.original}
              onChange={(e) => setForm({ ...form, original: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Corrección correcta</label>
            <textarea
              placeholder="Lo que debería haber dicho"
              value={form.correction}
              onChange={(e) => setForm({ ...form, correction: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contexto (opcional)</label>
            <input
              placeholder="Ej: cliente preguntó por horarios"
              value={form.context}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button onClick={handleCreate} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white">
            Guardar corrección
          </button>
        </div>
      )}

      <div className="space-y-3">
        {corrections.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded bg-red-50 p-3">
                <p className="text-xs font-medium text-red-600 mb-1">Original</p>
                <p className="text-sm text-slate-700">{c.original}</p>
              </div>
              <div className="rounded bg-green-50 p-3">
                <p className="text-xs font-medium text-green-600 mb-1">Corrección</p>
                <p className="text-sm text-slate-700">{c.correction}</p>
              </div>
            </div>
            {c.context && (
              <p className="mt-2 text-xs text-slate-500">Contexto: {c.context}</p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              {new Date(c.createdAt).toLocaleDateString("es-CL")}
            </p>
          </div>
        ))}
        {corrections.length === 0 && (
          <p className="text-center text-slate-400 py-8">
            No hay correcciones registradas. Agrega la primera para empezar a entrenar al asistente.
          </p>
        )}
      </div>
    </div>
  );
}
