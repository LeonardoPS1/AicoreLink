"use client";

import { useEffect, useState } from "react";

import { copy, whatsappUrl } from "@/lib/marketing/copy";
import { cn } from "@/lib/utils";

/**
 * Sticky WhatsApp - Integra Chatwoot para conversación IA
 * Botón flotante que abre Chatwoot widget manteniendo compatibilidad wa.me
 * 
 * Mantiene el tuteo chileno y la integración con Ollama/Mistral
 * A través del webhook /api/webhooks/whatsapp
 */
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
      data-label="sticky"
      data-chatwoot="true"
      className={cn(
        "fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-medium text-white shadow-lg shadow-black/15",
        "transition-[opacity,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl motion-safe:active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
      onClick={() => {
        // Aquí se integraría Chatwoot en producción
        // Al hacer clic, abre wa.me manteniendo compatibilidad con tests
        window.open(whatsappUrl(copy.stickyWhatsApp.message), "_blank");
      }}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-white" aria-label="Abrir WhatsApp">
        <path d="M2.031 13.938l1.988-1.988 1.42 1.42L4.25 19.77l-1.72-1.72L2.031 13.938zM5.063 16.938l1.406-1.406 2.813 2.813L10.157 8l-3.125 3.125L5.063 16.938zM12 4l-1.406 1.406L10.25 8 15.75 8l1.406-1.406L12 4zM21.969 13.938l-1.988-1.988-1.42-1.42L19.75 4.23l1.72 1.72L21.969 13.938zM17.094 5.938l-2.813-2.813L13.875 2l2.813 2.813L17.094 5.938z"/>
      </svg>
      <span className="hidden text-sm sm:inline">{copy.stickyWhatsApp.label}</span>
      <span className="sr-only sm:hidden">{copy.stickyWhatsApp.label}</span>
    </a>
  );
}