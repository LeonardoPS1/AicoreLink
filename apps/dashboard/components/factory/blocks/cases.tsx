"use client";

export function CasesBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Casos de éxito", cases = [] } = content;

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        {cases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cases.map((caseItem: any, index: number) => (
              <article key={index} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-navy mb-3">{caseItem.title || `Caso ${index + 1}`}</h3>
                {caseItem.client && <p className="text-slate-500 mb-2"><strong>Cliente:</strong> {caseItem.client}</p>}
                {caseItem.problem && <p className="text-slate-600 mb-2"><strong>Desafío:</strong> {caseItem.problem}</p>}
                {caseItem.solution && <p className="text-slate-600 mb-2"><strong>Solución:</strong> {caseItem.solution}</p>}
                {caseItem.results && <p className="text-teal-dark font-medium"><strong>Resultados:</strong> {caseItem.results}</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>No hay casos de éxito configurados.</p>
          </div>
        )}
      </div>
    </section>
  );
}