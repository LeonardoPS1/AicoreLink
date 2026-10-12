import type { Metadata } from "next";
import Link from "next/link";

import { AttentionTest } from "@/components/marketing/attention-test";
import { Reveal } from "@/components/ui/reveal";
import { copy } from "@/lib/marketing/copy";

const PAGE_TITLE = "¿Qué tan bien atiende tu negocio? | AicoreLink";
const PAGE_DESCRIPTION =
  "Responde 8 preguntas de sí o no y descubre en segundos qué está dejando pasar tu negocio. Sin registro y sin compromiso.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/herramientas/test-atencion" },
  openGraph: {
    type: "website",
    url: "/herramientas/test-atencion",
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

/**
 * Reads the optional `?monto=<CLP>` a visitor carries over from the calculator
 * (ruling R14). Anything that is not a positive finite number is dropped, so a
 * hand-edited URL can never inject a bogus estimate into the WhatsApp message.
 */
function parseAmountCLP(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return undefined;

  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

export default function TestAtencionPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  return (
    <section id="test-atencion" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <Reveal>
          <header className="text-center">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-navy md:text-4xl">
              {copy.attentionTest.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
              {copy.attentionTest.subtitle}
            </p>
          </header>
        </Reveal>

        <Reveal delay={90} className="mt-10">
          <AttentionTest initialAmountCLP={parseAmountCLP(searchParams?.monto)} />
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
