import { db } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

const RUBROS = ["clinica", "gimnasio", "salon", "veterinaria"];
const COMUNAS = ["santiago", "providencia", "las-condes", "vitacura", "nunoa", "maipu", "la-florida", "puente-alto"];

export async function generateStaticParams() {
  return RUBROS.flatMap((rubro) =>
    COMUNAS.map((comuna) => ({ rubro, comuna }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rubro: string; comuna: string }>;
}): Promise<Metadata> {
  const { rubro, comuna } = await params;
  const rubroName = rubro.charAt(0).toUpperCase() + rubro.slice(1);
  const comunaName = comuna
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    title: `${rubroName} en ${comunaName} | Aicore`,
    description: `Automatiza tu ${rubroName.toLowerCase()} en ${comunaName} con IA. Agenda, WhatsApp, recordatorios y más.`,
  };
}

export default async function SolucionPage({
  params,
}: {
  params: Promise<{ rubro: string; comuna: string }>;
}) {
  const { rubro, comuna } = await params;
  const rubroName = rubro.charAt(0).toUpperCase() + rubro.slice(1);
  const comunaName = comuna
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Get testimonials for this rubro/comuna if any
  let testimonials: any[] = [];
  try {
    testimonials = await db.testimonial.findMany({
      where: { approved: true, published: true },
      take: 3,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB not available at build time
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-navy">
        {rubroName} en {comunaName}
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Automatiza tu {rubroName.toLowerCase()} en {comunaName} con inteligencia artificial.
        Agenda online, WhatsApp automático, recordatorios y más.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Agenda online 24/7</h3>
          <p className="text-sm text-slate-600">Tus clientes agendan solos, sin llamadas.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">WhatsApp automático</h3>
          <p className="text-sm text-slate-600">Confirmaciones, recordatorios y seguimiento.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Asistente IA</h3>
          <p className="text-sm text-slate-600">Responde consultas frecuentes al instante.</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">Reportes y métricas</h3>
          <p className="text-sm text-slate-600">Controla tu negocio en tiempo real.</p>
        </div>
      </div>

      {testimonials.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-navy mb-4">Lo que dicen nuestros clientes</h2>
          <div className="space-y-4">
            {testimonials.map((t) => (
              <blockquote key={t.id} className="rounded-lg border p-4">
                <p className="italic text-slate-700">&ldquo;{t.content}&rdquo;</p>
                <footer className="mt-2 text-sm text-slate-500">
                  {t.authorName} — {t.rating}/5 estrellas
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <Link
          href="/#contacto"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
        >
          Solicitar demo gratis
        </Link>
      </div>
    </div>
  );
}