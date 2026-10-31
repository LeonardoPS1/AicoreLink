import type { Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";
import { copy } from "@/lib/marketing/copy";
import { absoluteUrl } from "@/lib/marketing/site";

const PAGE_TITLE = copy.legal.privacidad.pageTitle;
const PAGE_DESCRIPTION = copy.legal.privacidad.pageDescription;
const CANONICAL_PATH = "/legal/privacidad";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: CANONICAL_PATH },
  openGraph: {
    type: "website",
    url: CANONICAL_PATH,
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

export default function PrivacyPage() {
  // Split content by double newlines to render as paragraphs
  const paragraphs = copy.legal.privacidad.content.split("\n\n").filter(Boolean);

  return (
    <section id="legal-privacidad" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <Reveal>
          <header className="text-center">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-navy md:text-4xl">
              Política de privacidad
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
              {PAGE_DESCRIPTION}
            </p>
          </header>
        </Reveal>

        <Reveal delay={90} className="mt-10 prose prose-slate max-w-none">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
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