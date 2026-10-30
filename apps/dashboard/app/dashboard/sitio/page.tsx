"use client";

import { useEffect, useState } from "react";

export default function MiSitioPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((tenants) => {
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tid = tenants[0].id;
          fetch(`/api/tenants/${tid}/site`)
            .then((r) => r.json())
            .then((d) => {
              setData({ ...d, tenantId: tid });
              if (d.profile) {
                setForm({
                  name: d.profile.name ?? "",
                  phone: d.profile.phone ?? "",
                  email: d.profile.email ?? "",
                  address: d.profile.address ?? "",
                  description: d.profile.description ?? "",
                });
              }
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!data?.tenantId) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/tenants/${data.tenantId}/site`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg("Sitio actualizado correctamente");
      } else {
        const d = await res.json();
        setMsg(d.error || "Error al guardar");
      }
    } catch {
      setMsg("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">Mi Sitio</h1>

      {data?.site && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-2">
          <h2 className="text-lg font-semibold">Estado del sitio</h2>
          <p className="text-sm text-slate-600">
            Subdominio: <span className="font-mono">{data.site.subdomain}</span>
          </p>
          <p className="text-sm text-slate-600">
            Estado: <span className={`font-medium ${data.site.status === "published" ? "text-green-600" : "text-yellow-600"}`}>{data.site.status}</span>
          </p>
          {data.site.publishedAt && (
            <p className="text-sm text-slate-600">
              Publicado: {new Date(data.site.publishedAt).toLocaleDateString("es-CL")}
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Perfil del negocio</h2>
        {msg && <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-600">{msg}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Teléfono</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Dirección</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Descripción</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={3} />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}