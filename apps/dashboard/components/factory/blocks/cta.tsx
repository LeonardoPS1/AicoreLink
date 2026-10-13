"use client";

export function CtaBlock({ content }: { content: Record<string, any> }) {
  const {
    headline = "¿Listo para empezar?",
    buttonText = "Agendar ahora",
    whatsappText = "Hola, quiero más información",
    subheadline = "",
  } = content;

  return (
    <section className="py-16 bg-gradient-to-r from-navy to-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{headline}</h2>
        {subheadline && <p className="text-slate-300 mb-8 text-lg">{subheadline}</p>}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-brand text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-brand-dark transition-colors">
            {buttonText}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-teal text-teal-light px-8 py-3 rounded-lg font-semibold text-lg hover:bg-teal/10 transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}