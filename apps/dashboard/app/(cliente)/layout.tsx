import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

// Aplica a TODAS las paginas dentro de (cliente)/*: mismo motivo que en el
// layout de (admin) - datos por tenant, nunca estaticos.
export const dynamic = "force-dynamic";

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === "dev_aicore";

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-navy p-6 text-white">
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="rounded px-3 py-2 hover:bg-white/10">
            Resumen
          </Link>
          <Link href="/whatsapp" className="rounded px-3 py-2 hover:bg-white/10">
            WhatsApp
          </Link>
          <Link href="/email" className="rounded px-3 py-2 hover:bg-white/10 opacity-50">
            Email (proximamente)
          </Link>
          <Link href="/rrss" className="rounded px-3 py-2 hover:bg-white/10 opacity-50">
            RRSS (proximamente)
          </Link>
          {isAdmin && (
            <Link href="/admin/tenants" className="rounded px-3 py-2 hover:bg-white/10">
              Admin (Fase 5)
            </Link>
          )}
        </nav>
      </aside>
      <main className="flex-1 bg-slate-50 p-8">
        <div className="mb-6 text-sm text-slate-500">
          Sesion: {(session?.user as any)?.email}
        </div>
        {children}
      </main>
    </div>
  );
}
