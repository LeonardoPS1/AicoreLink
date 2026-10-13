"use client";

import Image from "next/image";

export function HeroBlock({ content }: { content: Record<string, any> }) {
  const {
    headline = "Tu negocio atendiendo, aunque estés ocupado",
    subheadline = "La mejor solución para tu negocio",
    ctaPrimary = "Reservar hora",
    ctaSecondary = "Hablar por WhatsApp",
    backgroundImage = "",
  } = content;

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-navy via-slate-900 to-slate-800 text-white overflow-hidden">
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
      )}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          {headline}
        </h1>
        {subheadline && (
          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto">
            {subheadline}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-brand text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-brand-dark transition-colors">
            {ctaPrimary}
          </button>
          <button className="border-2 border-teal text-teal-light px-8 py-3 rounded-lg font-semibold text-lg hover:bg-teal/10 transition-colors">
            {ctaSecondary}
          </button>
        </div>
      </div>
    </section>
  );
}