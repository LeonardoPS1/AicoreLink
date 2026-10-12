import type { Metadata } from "next";
import Link from "next/link";

import { LeadCostCalculator } from "@/components/marketing/lead-cost-calculator";
import { Reveal } from "@/components/ui/reveal";
import { copy } from "@/lib/marketing/copy";

const PAGE_TITLE = "¿Cuánto te cuesta no responder? | AicoreLink";
const PAGE_DESCRIPTION =
  "Calcula en segundos cuánta plata podrías estar perdiendo por no responder a tiempo. Usa tus propios números, sin registro y sin compromiso.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/herramientas/calculadora" },
  openGraph: {
    type: "website",
    url: "/herramientas/calculadora",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function CalculadoraPage() {
  return (
    <section id="calculadora" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <Reveal>
          <header className="text-center">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-navy md:text-4xl">
              {copy.calculator.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
              {copy.calculator.subtitle}
            </p>
          </header>
        </Reveal>

        <Reveal delay={90} className="mt-10">
          <LeadCostCalculator />
        </Reveal>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-medium text-brand hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
