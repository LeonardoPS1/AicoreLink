import { Suspense } from "react";
import { Metadata } from "next";
import { withTenant } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { SiteReviewPanel, type SiteData } from "./site-review-panel";

export const metadata: Metadata = {
  title: "Revisión de Sitio - Fábrica",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ siteId: string }>;
}

async function getSiteData(siteId: string, tenantId: string): Promise<SiteData | null> {
  const site = await withTenant(tenantId, async (tx) => {
    const site = await tx.site.findUnique({
      where: { id: siteId },
      include: {
        businessProfile: true,
        template: true,
        pages: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            path: true,
            title: true,
            content: true,
            meta: true,
            order: true,
          },
        },
        versions: {
          orderBy: { version: "desc" },
          select: {
            id: true,
            version: true,
            changelog: true,
            createdBy: true,
            createdAt: true,
          },
        },
      },
    });
    return site;
  });

  if (!site) return null;

  // Transform pages to match SiteData interface
  const pagesWithBlocks = site.pages.map((page) => ({
    ...page,
    content: (page.content as { blocks: any[] }) || { blocks: [] },
    meta: (page.meta as Record<string, any>) || {},
  }));

  // Convert versions createdAt from Date to string
  const versionsWithStringDates = site.versions.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  return { ...site, pages: pagesWithBlocks, versions: versionsWithStringDates } as SiteData;
}

export default async function FactorySiteReviewPage({ params }: PageProps) {
  const { siteId } = await params;
  const tenantId = "demo-tenant"; // In production, get from session

  const site = await getSiteData(siteId, tenantId);

  if (!site) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Sitio no encontrado</h1>
          <p className="text-slate-500">El sitio solicitado no existe o no tienes acceso.</p>
        </div>
      </div>
    );
  }

  return <SiteReviewPanel site={site} tenantId={tenantId} />;
}

function SiteReviewPanelSkeleton() {
  return (
    <div className="grid grid-cols-[25%_50%_25%] gap-6 h-[calc(100vh-120px)]">
      {/* Left skeleton */}
      <div className="space-y-4">
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
      </div>
      {/* Center skeleton */}
      <div className="space-y-4">
        <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-[calc(100%-100px)] bg-slate-100 rounded-xl animate-pulse" />
      </div>
      {/* Right skeleton */}
      <div className="space-y-4">
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-[calc(100%-300px)] bg-slate-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}