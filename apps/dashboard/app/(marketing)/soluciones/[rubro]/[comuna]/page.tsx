import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getVertical,
  getComuna,
  generateStaticParams as genParams,
} from "@/lib/marketing/seo-local";

export const dynamic = "force-static";

export function generateStaticParams() {
  return genParams();
}

export async function generateMetadata({
  params,
}: {
  params: { rubro: string; comuna: string };
}): Promise<Metadata> {
  const vertical = getVertical(params.rubro);
  const comuna = getComuna(params.comuna);
  if (!vertical || !comuna) return {};

  const title = `${vertical.name} en ${comuna.name} — AicoreLink`;
  const description = `${vertical.tagline}. Sitio web con IA para ${vertical.name.toLowerCase()}s en ${comuna.name}, ${comuna.region}. Responde WhatsApp, agenda citas y atiende 24/7.`;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default function SolucionLocalPage({
  params,
}: {
  params: { rubro: string; comuna: string };
}) {
  const vertical = getVertical(params.rubro);
  const comuna = getComuna(params.comuna);
  if (!vertical || !comuna) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-4 text-3xl font-bold text-navy">
        {vertical.name} en {comuna.name}
      </h1>
      <p className="mb-8 text-lg text-slate-600">{vertical.tagline}</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-navy">Problemas comunes</h2>
        <ul className="space-y-2">
          {vertical.painPoints.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-700">
              <span className="mt-1 text-red-500">✗</span>
              {p}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-navy">Lo que incluye</h2>
        <ul className="space-y-2">
          {vertical.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-700">
              <span className="mt-1 text-green-500">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-lg bg-slate-50 p-6">
        <h2 className="mb-3 text-xl font-semibold text-navy">
          ¿Tienes una {vertical.name.toLowerCase()} en {comuna.name}?
        </h2>
        <p className="mb-4 text-slate-600">
          AicoreLink crea tu sitio web con IA que atiende por WhatsApp, agenda citas y
          responde consultas las 24 horas. Sin código, sin complicaciones.
        </p>
        <Link
          href="/herramientas/calculadora"
          className="inline-block rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white"
        >
          Calcula cuánto pierdes por no responder
        </Link>
      </section>
    </div>
  );
}