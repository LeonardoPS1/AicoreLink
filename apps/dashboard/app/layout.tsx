import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/marketing/site";

export const metadata: Metadata = {
  // Resolves every relative URL in `metadata` (canonical, openGraph) to the
  // production origin, so links stay absolute when the app is served elsewhere.
  // The landing page sets its own title, which overrides the default below.
  metadataBase: new URL(SITE_URL),
  title: "Dashboard",
  description: "Plataforma multitenant para gestión de canales conversacionales",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={GeistSans.variable}>
      <body className="bg-slate-50 font-sans text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}