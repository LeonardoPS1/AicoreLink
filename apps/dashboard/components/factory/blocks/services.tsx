"use client";

export function ServicesBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Nuestros servicios", items = [] } = content;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((service: any, index: number) => (
            <article
              key={index}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold text-navy mb-2">{service.name || `Servicio ${index + 1}`}</h3>
              {service.description && (
                <p className="text-slate-600 mb-3">{service.description}</p>
              )}
              {service.priceCLP && (
                <div className="flex items-center gap-2 text-teal-dark font-semibold">
                  <span className="text-2xl">${service.priceCLP.toLocaleString("es-CL")}</span>
                  <span className="text-sm text-slate-500">CLP + IVA</span>
                </div>
              )}
              {service.durationMin && (
                <p className="text-sm text-slate-500 mt-2">⏱ {service.durationMin} min</p>
              )}
            </article>
          ))}
        </div>
        {items.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>No hay servicios configurados. Agrega servicios en el perfil del negocio.</p>
          </div>
        )}
      </div>
    </section>
  );
}