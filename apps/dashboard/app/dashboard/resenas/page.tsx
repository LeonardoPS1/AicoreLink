"use client";

import { useEffect, useState } from "react";

interface Review {
  id: string;
  authorName: string;
  authorRole: string | null;
  content: string;
  rating: number;
  approved: boolean;
  published: boolean;
  createdAt: string;
}

export default function ResenasPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState("0");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ authorName: "", authorRole: "", content: "", rating: 5 });
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((tenants) => {
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tid = tenants[0].id;
          setTenantId(tid);
          fetch(`/api/tenants/${tid}/reviews`)
            .then((r) => r.json())
            .then((d) => {
              setReviews(d.reviews ?? []);
              setAvgRating(d.avgRating ?? "0");
              setTotal(d.total ?? 0);
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
    const res = await fetch(`/api/tenants/${tenantId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setReviews([created, ...reviews]);
      setTotal(total + 1);
      setShowForm(false);
      setForm({ authorName: "", authorRole: "", content: "", rating: 5 });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Reseñas</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancelar" : "Agregar reseña"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Rating promedio</p>
          <p className="mt-1 text-2xl font-bold text-navy">{avgRating} ⭐</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Total reseñas</p>
          <p className="mt-1 text-2xl font-bold text-navy">{total}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Publicadas</p>
          <p className="mt-1 text-2xl font-bold text-navy">{reviews.filter((r) => r.published).length}</p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
          <input placeholder="Nombre del autor" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Cargo / Rol" value={form.authorRole} onChange={(e) => setForm({ ...form, authorRole: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <textarea placeholder="Contenido de la reseña" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={3} />
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r} ⭐</option>)}
          </select>
          <button onClick={handleCreate} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white">Guardar</button>
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium">{r.authorName}</span>
                {r.authorRole && <span className="text-sm text-slate-500"> — {r.authorRole}</span>}
              </div>
              <span className="text-sm">{r.rating} ⭐</span>
            </div>
            <p className="text-sm text-slate-600">{r.content}</p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(r.createdAt).toLocaleDateString("es-CL")}
              {r.published && " · Publicada"}
              {r.approved && " · Aprobada"}
            </p>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-center text-slate-400">No hay reseñas registradas.</p>
        )}
      </div>
    </div>
  );
}