"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar solicitud");
        return;
      }

      setMessage(data.message);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg"
      >
        <h1 className="mb-1 text-2xl font-bold text-navy">Recuperar contraseña</h1>
        <p className="mb-6 text-sm text-slate-500">Te enviaremos instrucciones a tu email</p>

        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mb-4 text-sm text-green-600">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar instrucciones"}
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