"use client";

import { useState } from "react";

export default function TestimonialPage() {
  const [form, setForm] = useState({
    authorName: "",
    authorRole: "",
    content: "",
    rating: 5,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar testimonio");
      }
      setSuccess(true);
      setForm({ authorName: "", authorRole: "", content: "", rating: 5 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">Enviar Testimonio</h1>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
          Testimonio enviado. El equipo de Aicore lo revisara y publicara.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tu nombre</label>
          <input
            type="text"
            value={form.authorName}
            onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cargo / Rol</label>
          <input
            type="text"
            value={form.authorRole}
            onChange={(e) => setForm((p) => ({ ...p, authorRole: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Ej: Dueño, Gerente"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Testimonio</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={4}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Rating (1-5)</label>
          <select
            value={form.rating}
            onChange={(e) => setForm((p) => ({ ...p, rating: Number(e.target.value) }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>
                {r} {r === 5 ? "⭐⭐⭐⭐⭐" : ""}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar Testimonio"}
        </button>
      </form>
    </div>
  );
}