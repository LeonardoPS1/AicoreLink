import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { Metadata } from "next";
import { Providers } from "@/app/providers";

// Aplica a TODAS las páginas dentro de (cliente)/*: mismo motivo que en el
// layout de (admin) - datos por tenant, nunca estáticos.
export const dynamic = "force-dynamic";

// Ninguna pantalla del panel debe indexarse: sin sesión sólo muestran un
// esqueleto. Ver el comentario equivalente en (admin)/layout.tsx.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === "admin";

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
            Email (próximamente)
          </Link>
          <Link href="/rrss" className="rounded px-3 py-2 hover:bg-white/10 opacity-50">
            RRSS (próximamente)
          </Link>
          {isAdmin && (
            <Link href="/tenants" className="rounded px-3 py-2 hover:bg-white/10">
              Admin
            </Link>
          )}
          {!isAdmin && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded px-3 py-2 hover:bg-white/10 text-sm text-slate-700"
            >
              Cerrar sesión
            </button>
          )}
        </nav>
      </aside>
      <main className="flex-1 bg-slate-50 p-8">
        <div className="mb-6 text-sm text-slate-500">
          Sesión: {(session?.user as any)?.email}
        </div>
        <Providers>{children}</Providers>
      </main>
    </div>
  );
}