"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";
import { copy } from "@/lib/marketing/copy";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ease-out",
        solid
          ? "border-b border-slate-200 bg-white/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-20">
        <a
          href="#inicio"
          className="group inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-teal text-sm font-bold text-white shadow-sm"
          >
            A
          </span>
          <span
            className={cn(
              "text-lg font-semibold tracking-tight transition-colors duration-300",
              solid ? "text-navy" : "text-white",
            )}
          >
            {copy.brand.name}
          </span>
        </a>

        <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
          {copy.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                solid
                  ? "text-slate-600 hover:bg-slate-100 hover:text-navy"
                  : "text-slate-200 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#contacto"
            data-track="cta_click"
            data-label="header"
            className={cn(
              buttonClasses(solid ? "primary" : "secondary", "md"),
              "hidden sm:inline-flex",
              !solid && "border-white/30 bg-white/10 text-white hover:border-white hover:bg-white/20 hover:text-white",
            )}
          >
            {copy.header.ctaLabel}
          </a>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "grid h-10 w-10 place-items-center rounded-lg transition-colors duration-150 md:hidden",
              solid ? "text-navy hover:bg-slate-100" : "text-white hover:bg-white/10",
            )}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-slate-200 bg-white md:hidden"
      >
        <nav aria-label="Navegación principal móvil" className="mx-auto max-w-6xl px-4 py-4">
          <ul className="flex flex-col">
            {copy.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 hover:text-navy"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#contacto"
            data-track="cta_click"
            data-label="header-movil"
            onClick={() => setOpen(false)}
            className={cn(buttonClasses("primary", "lg"), "mt-3 w-full")}
          >
            {copy.header.ctaLabel}
          </a>
        </nav>
      </div>
    </header>
  );
}
