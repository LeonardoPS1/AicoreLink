"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { isStaffRole } from "@/lib/rbac";
import { buildNav, type NavItem } from "./nav";

/**
 * Single shell for both panels.
 *
 * The layout that renders this is a Server Component (it reads the session with
 * `getServerSession`). Server Components cannot pass event handlers such as
 * `onClick` across the RSC boundary, so the interactive sidebar lives here and
 * receives the server-resolved values as plain props.
 *
 * The role decides the menu. The aside is the whole navigation frame: on phones
 * it collapses into a top bar with the links scrolling sideways, so the panel
 * stays usable without a second copy of the menu or any client state.
 */
export function AppShell({
  role,
  email,
  tenantName,
  children,
}: {
  role: string;
  email: string | null;
  tenantName: string | null;
  children: React.ReactNode;
}) {
  const staff = isStaffRole(role);
  const items = buildNav(role);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="shrink-0 bg-navy text-white lg:w-60 lg:p-6">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-0 lg:py-0 lg:pb-6">
          <div className="flex items-baseline gap-2">
            {staff ? (
              <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
                Aicore
              </span>
            ) : (
              <span className="text-sm font-semibold">{tenantName ?? "Tu negocio"}</span>
            )}
            {email ? <span className="text-xs text-white/60">{email}</span> : null}
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 rounded px-2 py-1 text-sm text-slate-300 hover:bg-white/10"
          >
            Cerrar sesión
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm lg:flex-col lg:gap-1 lg:px-0 lg:pb-0">
          {items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
      </aside>

      <main className="flex-1 bg-slate-50 p-4 lg:p-8">{children}</main>
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  if (item.soon) {
    return (
      <span
        aria-disabled="true"
        className="cursor-not-allowed whitespace-nowrap rounded px-3 py-2 text-white/40"
      >
        {item.label} (próximamente)
      </span>
    );
  }

  return (
    <Link href={item.href} className="whitespace-nowrap rounded px-3 py-2 hover:bg-white/10">
      {item.label}
    </Link>
  );
}
