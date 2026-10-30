interface CaseStudy {
  businessName: string;
  vertical: string;
  metric: string;
  quote: string;
  author: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    businessName: "Peluquería María",
    vertical: "Barbería",
    metric: "3x más mensajes respondidos",
    quote: "Antes perdía clientes por no responder. Ahora el bot agenda solo.",
    author: "María, dueña",
  },
  {
    businessName: "Clínica Dental Sonrisa",
    vertical: "Clínica",
    metric: "40% menos inasistencias",
    quote: "Los recordatorios automáticos cambiaron todo.",
    author: "Dr. Pérez",
  },
  {
    businessName: "Taller Mecánico Rápido",
    vertical: "Taller",
    metric: "2x más presupuestos aceptados",
    quote: "Los clientes ya no llaman para preguntar el estado.",
    author: "Carlos, dueño",
  },
];

export function CaseStudiesSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-8 text-center text-2xl font-bold text-navy">
          Casos con cifras reales
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {CASE_STUDIES.map((cs, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="mb-2 text-sm font-medium text-brand">{cs.vertical}</p>
              <h3 className="mb-2 text-lg font-semibold text-navy">{cs.businessName}</h3>
              <p className="mb-3 text-2xl font-bold text-green-600">{cs.metric}</p>
              <p className="mb-3 text-sm italic text-slate-600">&ldquo;{cs.quote}&rdquo;</p>
              <p className="text-xs text-slate-400">— {cs.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}