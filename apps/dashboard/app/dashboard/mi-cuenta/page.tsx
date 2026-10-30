"use client";

import { useEffect, useState } from "react";
import { getServerSession } from "next-auth";

export default function MiCuentaPage() {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  const tenantId = "default"; // will be resolved from session

  useEffect(() => {
    // Get tenantId from session via a fetch to a simple endpoint
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const tid = data[0].id;
          fetch(`/api/tenants/${tid}/account`)
            .then((r) => r.json())
            .then((d) => { setAccount({ ...d, tenantId: tid }); setLoading(false); });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.tenantId) return;
    setChanging(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${account.tenantId}/account/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(data.message || "Contraseña actualizada");
        setPasswordForm({ currentPassword: "", newPassword: "" });
      } else {
        setError(data.error || "Error al cambiar contraseña");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setChanging(false);
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">Mi Cuenta</h1>

      {/* Profile info */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Perfil</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <p className="mt-1 text-sm text-slate-600">{account?.user?.email ?? "—"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Negocio</label>
          <p className="mt-1 text-sm text-slate-600">{account?.tenant?.name ?? "—"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Plan</label>
          <p className="mt-1 text-sm text-slate-600">{account?.tenant?.plan ?? "—"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Estado</label>
          <p className="mt-1 text-sm text-slate-600">{account?.tenant?.status ?? "—"}</p>
        </div>
      </div>

      {/* Billing info */}
      {account?.billing && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold">Facturación</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700">Plan</label>
            <p className="mt-1 text-sm text-slate-600">{account.billing.plan}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Monto</label>
            <p className="mt-1 text-sm text-slate-600">${account.billing.amount} {account.billing.currency}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Estado</label>
            <p className="mt-1 text-sm text-slate-600">{account.billing.status}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Facturación activa</label>
            <p className="mt-1 text-sm text-slate-600">{account.billing.billingActive ? "Sí" : "No"}</p>
          </div>
        </div>
      )}

      {/* Change password */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Cambiar Contraseña</h2>
        {msg && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{msg}</div>}
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Contraseña actual</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nueva contraseña (min 8)</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={changing}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {changing ? "Cambiando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}