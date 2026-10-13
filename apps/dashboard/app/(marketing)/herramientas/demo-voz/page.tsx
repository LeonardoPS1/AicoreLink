import type { Metadata } from "next";
import Link from "next/link";

import { VoiceDemo } from "@/components/marketing/voice-demo";
import { Reveal } from "@/components/ui/reveal";
import { copy } from "@/lib/marketing/copy";

const PAGE_TITLE = copy.voiceDemo.pageTitle;
const PAGE_DESCRIPTION = copy.voiceDemo.pageDescription;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/herramientas/demo-voz" },
  openGraph: {
    type: "website",
    url: "/herramientas/demo-voz",
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
 * Voice demo page. The interactive demo is a client component; this page only
 * provides the metadata, the heading and the surrounding layout.
 */
export default function DemoVozPage() {
  return (
    <section id="demo-voz" className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <Reveal>
          <header className="text-center">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-navy md:text-4xl">
              {copy.voiceDemo.title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
              {copy.voiceDemo.subtitle}
            </p>
          </header>
        </Reveal>

        <Reveal delay={90} className="mt-10">
          <VoiceDemo />
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