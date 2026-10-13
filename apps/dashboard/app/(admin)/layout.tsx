import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import { AdminShell } from "@/components/admin/admin-shell";

// Aplica a TODAS las páginas dentro de (admin)/*: nunca pre-renderizar en
// build time, porque consultan datos por tenant en cada request. Además,
// durante el build de Docker no hay conexión real a la base de datos.
export const dynamic = "force-dynamic";

// El panel no debe aparecer en buscadores. Un Disallow en robots.txt alcanza
// para no ser rastreado, pero no impide indexar una URL descubierta por otro
// camino, así que la señal se manda también acá.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminShell>{children}</AdminShell>
    </Providers>
  );
}
