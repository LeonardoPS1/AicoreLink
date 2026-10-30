import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DirectorioPage() {
  const entries = await db.testimonial.findMany({
    where: { approved: true, published: true },
    include: { tenant: { include: { businessProfiles: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-navy">Directorio de negocios</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((t) => {
          const bp = t.tenant.businessProfiles[0];
          return (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-navy">{bp?.name ?? t.tenant.name}</h2>
              <p className="text-sm text-slate-500">{bp?.rubro ?? "—"}</p>
              <p className="mt-2 text-sm text-slate-600">{bp?.description ?? ""}</p>
              <p className="mt-4 text-sm italic text-slate-700">&ldquo;{t.content}&rdquo;</p>
              <p className="mt-2 text-xs text-slate-400">
                {t.authorName} — {t.rating}/5 estrellas
              </p>
            </div>
          );
        })}
      </div>
      {entries.length === 0 && (
        <p className="text-center text-slate-500">Próximamente más negocios.</p>
      )}
    </div>
  );
}
