import type { Metadata } from "next";

import { Reveal } from "@/components/ui/reveal";
import { copy } from "@/lib/marketing/copy";

const PAGE_TITLE = copy.legal.cookies.pageTitle;
const PAGE_DESCRIPTION = copy.legal.cookies.pageDescription;
const CANONICAL_PATH = "/legal/cookies";

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

export default function CookiesPage() {
  const paragraphs = copy.legal.cookies.content.split("\n\n").filter(Boolean);

  return (
    <section id="legal-cookies" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <Reveal>
          <header className="text-center">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-navy md:text-4xl">
              Política de cookies
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
          <a href="/" className="text-sm font-medium text-brand hover:underline">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </section>
  );
}