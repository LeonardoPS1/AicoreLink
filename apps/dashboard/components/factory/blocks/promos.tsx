"use client";

export function PromosBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Promociones vigentes", promotions = [] } = content;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        {promotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotions.map((promo: any, index: number) => (
              <article
                key={index}
                className="relative rounded-xl border border-slate-200 bg-gradient-to-br from-teal/5 to-teal/10 p-6 overflow-hidden"
              >
                {promo.badge && (
                  <span className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {promo.badge}
                  </span>
                )}
                <h3 className="text-xl font-bold text-navy mb-2">{promo.title || `Promoción ${index + 1}`}</h3>
                {promo.description && <p className="text-slate-600 mb-4">{promo.description}</p>}
                {promo.discount && (
                  <div className="text-2xl font-bold text-teal-dark mb-4">
                    {promo.discount}%
                  </div>
                )}
                {promo.validUntil && (
                  <p className="text-sm text-slate-500">Válido hasta: {promo.validUntil}</p>
                )}
                <button className="mt-4 bg-teal text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-dark transition-colors">
                  Aprovechar
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>No hay promociones vigentes.</p>
          </div>
        )}
      </div>
    </section>
  );
}