"use client";

import { useEffect, useState } from "react";

import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "aicorelink-cookie-consent";

export function CookieNotice() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!consent) {
      setShow(true);
    }
  }, []);

  if (!mounted || !show) {
    return null;
  }

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    }
    setShow(false);
  };

  const handleDecline = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "declined");
    }
    setShow(false);
  };

  return (
    <Reveal className="fixed bottom-0 left-0 right-0 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-md">
      <div
        role="region"
        aria-label="Aviso de cookies"
        className="bg-white border border-slate-200 rounded-xl shadow-xl p-5 md:p-6 animate-fade-up"
      >
        <div className="flex items-start gap-3">
          <svg
            className="mt-0.5 flex-shrink-0 h-5 w-5 text-teal"
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">
              Utilizamos cookies propias y de terceros para que el sitio funcione bien
              (necesarias), entender cómo lo usas (analíticas) y mostrarte contenido
              relevante (marketing). Puedes aceptarlas todas, rechazar las no necesarias
              o <a href="/legal/cookies" className="underline hover:text-brand">leer más</a>.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleAccept}
                data-track="cookie_accept"
              >
                Aceptar todo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDecline}
                data-track="cookie_decline"
              >
                Rechazar no necesarias
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}