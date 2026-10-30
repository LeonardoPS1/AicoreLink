"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [rubro, setRubro] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, businessName, rubro }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear cuenta");
        return;
      }

      router.push("/login");
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
        <h1 className="mb-1 text-2xl font-bold text-navy">Crear cuenta</h1>
        <p className="mb-6 text-sm text-slate-500">Registra tu negocio en AicoreLink</p>

        <label className="mb-1 block text-sm font-medium">Nombre del negocio</label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
        />

        <label className="mb-1 block text-sm font-medium">Rubro</label>
        <input
          type="text"
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
        />

        <label className="mb-1 block text-sm font-medium">Contraseña (mín. 8 caracteres)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          required
          minLength={8}
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>

        <div className="mt-4 text-center text-sm">
          <a href="/login" className="text-slate-500 hover:underline">
            ¿Ya tienes cuenta? Ingresar
          </a>
        </div>
      </form>
    </div>
  );
}