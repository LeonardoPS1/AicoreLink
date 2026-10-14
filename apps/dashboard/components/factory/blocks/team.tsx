"use client";

export function TeamBlock({ content }: { content: Record<string, any> }) {
  const { sectionTitle = "Nuestro equipo", members = [] } = content;

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">{sectionTitle}</h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member: any, index: number) => (
            <article
              key={index}
              className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
            >
              {member.photoUrl && (
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element -- dynamic AI-generated URLs; no remotePatterns allowlist configured */}
                  <img
                    src={member.photoUrl}
                    alt={member.name || `Miembro ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="text-xl font-semibold text-navy mb-1">
                {member.name || `Miembro ${index + 1}`}
              </h3>
              {member.role && (
                <p className="text-brand font-medium mb-2">{member.role}</p>
              )}
              {member.bio && (
                <p className="text-slate-600 text-sm">{member.bio}</p>
              )}
            </article>
          ))}
        </div>
        {members.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>No hay equipo configurado. Agrega miembros en el perfil del negocio.</p>
          </div>
        )}
      </div>
    </section>
  );
}