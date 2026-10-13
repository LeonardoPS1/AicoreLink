"use client";

import { useState } from "react";

export function FaqBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Preguntas frecuentes", items = [] } = content;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item: any, index: number) => (
              <details
                key={index}
                className="group rounded-xl border border-slate-200 bg-white"
                open={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <h3 className="text-lg font-semibold text-navy pr-4">{item.question || `Pregunta ${index + 1}`}</h3>
                  <svg
                    className="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-600 animate-fade-up">
                  <p>{item.answer || "Respuesta pendiente"}</p>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>No hay preguntas frecuentes configuradas.</p>
          </div>
        )}
      </div>
    </section>
  );
}