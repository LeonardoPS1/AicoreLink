"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Onboarding {
  id: string;
  tenantId: string;
  tenantName: string;
  plan: string;
  status: string;
  founderAgreement: boolean;
  checklist: Record<string, boolean>;
  assignedTo: string | null;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
}

export default function OnboardingPage() {
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    rubro: "",
    plan: "basico",
    contactEmail: "",
    contactWhatsapp: "",
    assignedTo: "",
    founderAgreement: false,
  });

  useEffect(() => {
    fetch("/api/admin/onboarding")
      .then((r) => r.json())
      .then((data) => setOnboardings(Array.isArray(data) ? data : []))
      .catch(() => setOnboardings([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/admin/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setOnboardings([created.onboarding ? { ...created.onboarding, tenantName: created.tenant.name, plan: created.tenant.plan } : created, ...onboardings]);
      setShowForm(false);
      setForm({ businessName: "", rubro: "", plan: "basico", contactEmail: "", contactWhatsapp: "", assignedTo: "", founderAgreement: false });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/onboarding/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOnboardings(onboardings.map((o) => (o.id === id ? { ...o, status: updated.status } : o)));
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Onboarding de Tenants</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancelar" : "Nuevo Onboarding"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <input placeholder="Nombre del negocio" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="w-full border rounded px-3 py-2" />
          <input placeholder="Rubro" value={form.rubro} onChange={(e) => setForm({ ...form, rubro: e.target.value })} className="w-full border rounded px-3 py-2" />
          <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="w-full border rounded px-3 py-2">
            <option value="basico">Básico</option>
            <option value="intermedio">Intermedio</option>
            <option value="completo">Completo</option>
          </select>
          <input placeholder="Email de contacto" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full border rounded px-3 py-2" />
          <input placeholder="WhatsApp de contacto" value={form.contactWhatsapp} onChange={(e) => setForm({ ...form, contactWhatsapp: e.target.value })} className="w-full border rounded px-3 py-2" />
          <input placeholder="Asignado a" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="w-full border rounded px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.founderAgreement} onChange={(e) => setForm({ ...form, founderAgreement: e.target.checked })} />
            Acuerdo de fundador
          </label>
          <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Crear</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Tenant</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Asignado a</th>
              <th className="px-4 py-3">Fundador</th>
              <th className="px-4 py-3">Inicio</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {onboardings.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{o.tenantName}</td>
                <td className="px-4 py-3">{o.plan}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completado</option>
                  </select>
                </td>
                <td className="px-4 py-3">{o.assignedTo ?? "—"}</td>
                <td className="px-4 py-3">{o.founderAgreement ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(o.startedAt).toLocaleDateString("es-CL")}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/admin/pilots`} className="text-blue-600 hover:underline text-xs">Ver piloto</Link>
                </td>
              </tr>
            ))}
            {onboardings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No hay onboardings registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}