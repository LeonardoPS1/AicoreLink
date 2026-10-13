"use client";

export function BookingBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Reserva online", services = [], team = [], whatsappText = "Hola, quiero reservar" } = content;

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-navy mb-2">Servicio</label>
              <select className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-700 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none">
                <option value="">Selecciona un servicio</option>
                {services.map((s: any, i: number) => (
                  <option key={i} value={s.name}>
                    {s.name} {s.priceCLP ? `- $${s.priceCLP.toLocaleString("es-CL")} CLP` : ""}
                  </option>
                ))}
              </select>
            </div>
            {team.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-navy mb-2">Profesional</label>
                <select className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-700 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none">
                  <option value="">Cualquier profesional</option>
                  {team.map((t: any, i: number) => (
                    <option key={i} value={t.name}>
                      {t.name} {t.role ? `- ${t.role}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-navy mb-2">Fecha y hora</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-700 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-brand text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-brand-dark transition-colors flex-1">
                Confirmar reserva
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-teal text-teal-dark px-8 py-3 rounded-lg font-semibold text-lg hover:bg-teal/10 transition-colors text-center flex-1"
              >
                WhatsApp
              </a>
            </div>
          </div>
          {services.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p>No hay servicios configurados para reserva online.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}