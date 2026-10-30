"use client";

import { useEffect, useState } from "react";

interface Billing {
  id: string;
  amount: number;
  currency: string;
  status: string;
  invoiceUrl: string | null;
  lastPaymentAt: string | null;
  createdAt: string;
}

export default function BillingPage() {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayForm, setShowPayForm] = useState(false);
  const [form, setForm] = useState({ amount: "", description: "" });
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((tenants) => {
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tid = tenants[0].id;
          setTenantId(tid);
          fetch(`/api/tenants/${tid}/billing`)
            .then((r) => r.json())
            .then((d) => {
              setBillings(Array.isArray(d) ? d : d.billings ?? []);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePay = async () => {
    if (!tenantId || !form.amount) return;
    setPaying(true);
    try {
      const res = await fetch("/api/billing/mercadopago/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          amount: Number(form.amount),
          description: form.description || "Factura AicoreLink",
        }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      }
    } catch {
      alert("Error al procesar pago");
    }
    setPaying(false);
    setShowPayForm(false);
  };

  const statusColor: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    active: "bg-blue-100 text-blue-800",
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Facturación</h1>
        <button
          onClick={() => setShowPayForm(!showPayForm)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          {showPayForm ? "Cancelar" : "Nuevo pago"}
        </button>
      </div>

      {showPayForm && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
          <input
            type="number"
            placeholder="Monto"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handlePay}
            disabled={paying}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {paying ? "Procesando..." : "Pagar con Mercado Pago"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {billings.map((b) => (
          <div key={b.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy">
                  {b.currency} {Number(b.amount).toLocaleString("es-CL")}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(b.createdAt).toLocaleDateString("es-CL")}
                  {b.lastPaymentAt && ` · Pagado: ${new Date(b.lastPaymentAt).toLocaleDateString("es-CL")}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[b.status] ?? "bg-slate-100"}`}>
                  {b.status}
                </span>
                {b.invoiceUrl && (
                  <a
                    href={b.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ver pago
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        {billings.length === 0 && (
          <p className="text-center text-slate-400 py-8">No hay facturas registradas.</p>
        )}
      </div>
    </div>
  );
}
