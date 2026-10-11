import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Plataforma multitenant para gestión de canales conversacionales",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}