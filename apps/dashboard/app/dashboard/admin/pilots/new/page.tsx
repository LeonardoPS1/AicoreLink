"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PilotOnboardingNewPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: "",
    rubro: "",
    plan: "basico",
    contactEmail: "",
    contactWhatsapp: "",
    assignedTo: "",
    founderAgreement: false,
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pilots/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear onboarding");
      }
      router.push("/dashboard/admin/pilots");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">Nuevo Piloto (Onboarding)</h1>

      {/* Step indicators */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              s === step
                ? "bg-brand text-white"
                : s < step
                ? "bg-green-500 text-white"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Step 1: Business data */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-navy">Paso 1: Datos del negocio</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del negocio</label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ej: Peluqueria Maria"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Rubro</label>
            <input
              type="text"
              value={form.rubro}
              onChange={(e) => update("rubro", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ej: barberia, clinica, taller"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Plan</label>
            <select
              value={form.plan}
              onChange={(e) => update("plan", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="basico">Basico</option>
              <option value="intermedio">Intermedio</option>
              <option value="completo">Completo</option>
            </select>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!form.businessName || !form.rubro}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Step 2: Contact data */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-navy">Paso 2: Datos de contacto</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email de contacto</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => update("contactEmail", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="contacto@negocio.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">WhatsApp</label>
            <input
              type="text"
              value={form.contactWhatsapp}
              onChange={(e) => update("contactWhatsapp", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="+56912345678"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Responsable (operador)</label>
            <input
              type="text"
              value={form.assignedTo}
              onChange={(e) => update("assignedTo", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Nombre del operador asignado"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Atras
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!form.contactEmail || !form.contactWhatsapp}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation + checklist */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-navy">Paso 3: Confirmacion y checklist</h2>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
            <p><strong>Negocio:</strong> {form.businessName}</p>
            <p><strong>Rubro:</strong> {form.rubro}</p>
            <p><strong>Plan:</strong> {form.plan}</p>
            <p><strong>Email:</strong> {form.contactEmail}</p>
            <p><strong>WhatsApp:</strong> {form.contactWhatsapp}</p>
            <p><strong>Responsable:</strong> {form.assignedTo || "Sin asignar"}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="founderAgreement"
              checked={form.founderAgreement}
              onChange={(e) => update("founderAgreement", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="founderAgreement" className="text-sm text-slate-700">
              Acuerdo Fundador firmado (40% off x 3 meses, permanencia 6 meses, testimonio, contrato de datos)
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Atras
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Piloto"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}