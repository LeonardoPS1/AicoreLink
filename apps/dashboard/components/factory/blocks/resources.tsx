"use client";

export function ResourcesBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Recursos disponibles", resources = [] } = content;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        {resources.length > 0 ? (
          <div className="space-y-4">
            {resources.map((resource: any, index: number) => (
              <article key={index} className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">{resource.title || `Recurso ${index + 1}`}</h3>
                    {resource.description && <p className="text-sm text-slate-500">{resource.description}</p>}
                  </div>
                </div>
                <a
                  href={resource.url || "#"}
                  className="text-brand font-medium hover:underline whitespace-nowrap"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar →
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>No hay recursos disponibles.</p>
          </div>
        )}
      </div>
    </section>
  );
}