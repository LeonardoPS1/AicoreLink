"use client";

import { useEffect, useState } from "react";

interface TenantLink {
  tenantId: string;
  tenantName: string;
  role: string;
}

interface User {
  id: string;
  email: string;
  staffRole: string | null;
  createdAt: string;
  tenants: TenantLink[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    staffRole: "",
    tenantId: "",
    tenantRole: "cliente",
  });
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));

    fetch("/api/tenants")
      .then((r) => r.json())
      .then((data) => setTenants(Array.isArray(data) ? data : []))
      .catch(() => setTenants([]));
  }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        staffRole: form.staffRole || null,
        tenantId: form.tenantId || undefined,
        tenantRole: form.tenantRole,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setUsers([{ id: created.id, email: created.email, staffRole: form.staffRole || null, createdAt: new Date().toISOString(), tenants: form.tenantId ? [{ tenantId: form.tenantId, tenantName: tenants.find((t) => t.id === form.tenantId)?.name ?? "", role: form.tenantRole }] : [] }, ...users]);
      setShowForm(false);
      setForm({ email: "", password: "", staffRole: "", tenantId: "", tenantRole: "cliente" });
    }
  };

  const handleUpdateRole = async (userId: string, staffRole: string | null) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffRole }),
    });
    if (res.ok) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, staffRole } : u)));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Gestión de Usuarios</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancelar" : "Nuevo Usuario"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded px-3 py-2" />
          <input placeholder="Contraseña (min 8)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded px-3 py-2" />
          <select value={form.staffRole} onChange={(e) => setForm({ ...form, staffRole: e.target.value })} className="w-full border rounded px-3 py-2">
            <option value="">Sin rol staff (cliente)</option>
            <option value="dev_aicore">Dev Aicore</option>
            <option value="operador">Operador</option>
            <option value="soporte">Soporte</option>
          </select>
          <select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} className="w-full border rounded px-3 py-2">
            <option value="">Sin tenant (staff global)</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {form.tenantId && (
            <select value={form.tenantRole} onChange={(e) => setForm({ ...form, tenantRole: e.target.value })} className="w-full border rounded px-3 py-2">
              <option value="cliente">Cliente</option>
              <option value="admin">Admin</option>
            </select>
          )}
          <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Crear usuario</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol Staff</th>
              <th className="px-4 py-3">Tenants</th>
              <th className="px-4 py-3">Creado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.staffRole ?? ""}
                    onChange={(e) => handleUpdateRole(u.id, e.target.value || null)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="">Cliente</option>
                    <option value="dev_aicore">Dev Aicore</option>
                    <option value="operador">Operador</option>
                    <option value="soporte">Soporte</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.tenants.length > 0
                    ? u.tenants.map((t) => `${t.tenantName} (${t.role})`).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString("es-CL")}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}