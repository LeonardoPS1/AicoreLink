"use client";

import { useEffect, useState } from "react";

import { WhatsAppGlyph } from "@/components/marketing/whatsapp-glyph";
import { copy, whatsappUrl } from "@/lib/marketing/copy";
import { cn } from "@/lib/utils";

export function StickyWhatsApp() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={whatsappUrl(copy.stickyWhatsApp.message)}
      target="_blank"
      rel="noopener noreferrer"
      data-visible={visible}
      className={cn(
        "fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-medium text-white shadow-lg shadow-black/15",
        "transition-[opacity,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl motion-safe:active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <WhatsAppGlyph className="h-5 w-5" />
      <span className="hidden text-sm sm:inline">{copy.stickyWhatsApp.label}</span>
      <span className="sr-only sm:hidden">{copy.stickyWhatsApp.label}</span>
    </a>
  );
}
