import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { StickyWhatsApp } from "@/components/marketing/sticky-whatsapp";

// Document metadata for the landing lives in ./page.tsx (D1): one route, one
// source of truth. The root layout supplies metadataBase and the title template.

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
