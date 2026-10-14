"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

/**
 * Client shell for the customer area.
 *
 * The layout that renders this is a Server Component (it reads the session with
 * `getServerSession`). Server Components cannot pass event handlers such as
 * `onClick` across the RSC boundary, so the interactive sidebar lives here and
 * receives the server-resolved values as plain props.
 */
export function ClienteShell({
  isAdmin,
  email,
  children,
}: {
  isAdmin: boolean;
  email: string | null;
  children: React.ReactNode;
}) {
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
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          )}
        </nav>
      </aside>
      <main className="flex-1 bg-slate-50 p-8">
        <div className="mb-6 text-sm text-slate-500">Sesión: {email ?? "—"}</div>
        {children}
      </main>
    </div>
  );
}
