import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import { ClienteShell } from "@/components/cliente/cliente-shell";

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
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const email = (session?.user as { email?: string } | undefined)?.email ?? null;

  return (
    <Providers>
      <ClienteShell isAdmin={isAdmin} email={email}>
        {children}
      </ClienteShell>
    </Providers>
  );
}
