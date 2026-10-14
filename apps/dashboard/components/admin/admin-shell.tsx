"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, Menu, X } from "lucide-react";

import { ADMIN_NAV, type AdminNavItem } from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";

const COLLAPSE_STORAGE_KEY = "aicorelink.admin.sidebar";
const SIDEBAR_ID = "admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const rawPathname = usePathname();
  const pathname = rawPathname ?? "/";

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // The collapse state lives in localStorage. Reading it during the render
  // would break hydration, so we synchronise it after the component mounts.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
    setCollapsed(stored === "collapsed");
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, closeMobile]);

  // Lock the body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const isActive = useCallback(
    (item: AdminNavItem) => {
      if (item.href === "/") return pathname === "/";
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    },
    [pathname],
  );

  const activeItem = useMemo(() => {
    const candidates = ADMIN_NAV.filter((item) => isActive(item)).sort(
      (a, b) => b.href.length - a.href.length,
    );
    return candidates[0] ?? ADMIN_NAV[0];
  }, [isActive]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          COLLAPSE_STORAGE_KEY,
          next ? "collapsed" : "expanded",
        );
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
        />
      ) : null}

      <aside
        id={SIDEBAR_ID}
        aria-label="Panel de administración"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-200 ease-out",
          collapsed && "lg:w-16",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal text-sm font-semibold text-white">
            AL
          </span>
          <div className={cn("min-w-0", collapsed && "lg:sr-only")}>
            <p className="truncate text-sm font-semibold">AicoreLink</p>
            <p className="truncate text-xs text-teal">Panel de Administración</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={closeMobile}
            className="ml-auto rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Navegación principal"
          className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 text-sm"
        >
          {ADMIN_NAV.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-disabled={item.disabled ? "true" : undefined}
                onClick={item.disabled ? (event) => event.preventDefault() : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                  item.disabled && "pointer-events-none opacity-50",
                )}
              >
                {active ? (
                  <span
                    className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-teal"
                    aria-hidden="true"
                  />
                ) : null}
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className={cn("truncate", collapsed && "lg:sr-only")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 border-t border-white/10 px-3 py-4">
          <a
            href="/api/auth/signout"
            className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className={cn("truncate", collapsed && "lg:sr-only")}>
              Cerrar sesión
            </span>
          </a>
          <button
            type="button"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            onClick={toggleCollapsed}
            className="hidden rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:flex"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </aside>

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200 ease-out",
          collapsed ? "lg:pl-16" : "lg:pl-64",
        )}
      >
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            aria-controls={SIDEBAR_ID}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <p
              data-testid="admin-page-title"
              className="truncate text-sm font-semibold text-slate-900"
            >
              {activeItem?.label ?? "Panel"}
            </p>
            <nav
              aria-label="Migas de pan"
              className="mt-0.5 hidden items-center gap-1 text-xs text-slate-500 sm:flex"
            >
              <Link href="/" className="hover:text-slate-700">
                Panel
              </Link>
              {activeItem && activeItem.href !== "/" ? (
                <>
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                  <span className="font-medium text-slate-700">
                    {activeItem.label}
                  </span>
                </>
              ) : null}
            </nav>
          </div>
        </header>

        <main className="flex-1 bg-slate-50 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
