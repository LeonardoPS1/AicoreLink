"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al restablecer contraseña");
        return;
      }

      setMessage(data.message);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg text-center">
          <h1 className="mb-4 text-2xl font-bold text-navy">Token inválido</h1>
          <p className="text-sm text-slate-500">No se proporcionó un token de restablecimiento.</p>
          <a href="/forgot-password" className="mt-4 inline-block text-brand hover:underline">
            Solicitar nuevo token
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-1 text-2xl font-bold text-navy">Nueva contraseña</h1>
        <p className="mb-6 text-sm text-slate-500">Ingresa tu nueva contraseña</p>

        <label className="mb-1 block text-sm font-medium">Nueva contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
          minLength={8}
        />

        <label className="mb-1 block text-sm font-medium">Confirmar contraseña</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
          minLength={8}
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>

        <div className="mt-4 text-center text-sm">
          <a href="/login" className="text-slate-500 hover:underline">
            Volver al login
          </a>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-navy"><p className="text-white">Cargando...</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
