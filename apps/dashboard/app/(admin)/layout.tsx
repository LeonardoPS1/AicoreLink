import Link from "next/link";

// Aplica a TODAS las paginas dentro de (admin)/*: nunca pre-renderizar en
// build time, porque consultan datos por tenant en cada request. Ademas,
// durante el build de Docker no hay conexion real a la base de datos.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-slate-900 p-6 text-white">
        <h2 className="mb-1 text-lg font-bold">AicoreLink</h2>
        <p className="mb-8 text-xs text-teal">Panel Aicore Agency</p>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/tenants" className="rounded px-3 py-2 hover:bg-white/10">
            Tenants
          </Link>
          <Link href="/metricas" className="rounded px-3 py-2 hover:bg-white/10 opacity-50">
            Metricas (Fase 5)
          </Link>
          <Link href="/infraestructura" className="rounded px-3 py-2 hover:bg-white/10 opacity-50">
            Infraestructura (Fase 5)
          </Link>
        </nav>
      </aside>
      <main className="flex-1 bg-slate-50 p-8">{children}</main>
    </div>
  );
}
