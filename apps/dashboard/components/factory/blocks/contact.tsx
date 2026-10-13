"use client";

export function ContactBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Contacto", phone = "", email = "", address = "", hours = {}, mapEmbedUrl = "" } = content;

  const formatHours = (hoursObj: any): string[] => {
    if (!hoursObj || typeof hoursObj !== "object") return [];
    const days = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
    const result: string[] = [];
    for (const day of days) {
      const h = hoursObj[day];
      if (!h) continue;
      if (h.closed) result.push(`${day}: Cerrado`);
      else result.push(`${day}: ${h.open} - ${h.close}`);
    }
    return result;
  };

  const hoursList = formatHours(hours);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            {phone && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-navy">Teléfono</h3>
                  <a href={`tel:${phone}`} className="text-slate-600 hover:text-brand transition-colors">{phone}</a>
                </div>
              </div>
            )}
            {email && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-navy">Email</h3>
                  <a href={`mailto:${email}`} className="text-slate-600 hover:text-brand transition-colors">{email}</a>
                </div>
              </div>
            )}
            {address && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-navy">Dirección</h3>
                  <p className="text-slate-600">{address}</p>
                </div>
              </div>
            )}
            {hoursList && hoursList.length > 0 && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-navy">Horario</h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    {hoursList.map((h: string, i: number) => (
                      <div key={i}>{h}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          {mapEmbedUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}