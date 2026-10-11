import type { Metadata } from "next";

import { CtaSection } from "@/components/marketing/cta-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PainSection } from "@/components/marketing/pain-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { SolutionSection } from "@/components/marketing/solution-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { TrustBar } from "@/components/marketing/trust-bar";
import { VerticalsSection } from "@/components/marketing/verticals-section";
import { serializeStructuredData } from "@/lib/marketing/structured-data";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // The image comes from ./opengraph-image.tsx via the file convention.
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

/**
 * JSON-LD document ready to inline in the page. Serialised once at module scope:
 * the content is static, so there is no reason to rebuild it per request.
 */
const structuredData = serializeStructuredData();

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredData }}
      />
      <HeroSection />
      <TrustBar />
      <PainSection />
      <SolutionSection />
      <HowItWorks />
      <VerticalsSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
