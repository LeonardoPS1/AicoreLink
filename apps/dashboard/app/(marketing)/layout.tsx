import type { Metadata } from "next";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { StickyWhatsApp } from "@/components/marketing/sticky-whatsapp";

export const metadata: Metadata = {
  title: "AicoreLink — Sitios web con IA para negocios locales",
  description:
    "Creamos tu página web con un asistente de IA que responde por WhatsApp, agenda citas y nunca deja un cliente sin contestar. Todo incluido en una cuota mensual.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader />
      <main id="inicio" className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <SiteFooter />
      <StickyWhatsApp />
    </div>
  );
}
