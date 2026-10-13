"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { SiteReviewPanel, type SiteData } from "./site-review-panel";

export default function FactorySiteReviewPage() {
  const params = useParams<{ siteId: string }>();
  const searchParams = useSearchParams();
  const siteId = params?.siteId;
  const tenantId = searchParams.get("tenant") || "demo-tenant";

  const [site, setSite] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/factory/sites/${siteId}`, {
        headers: { "x-tenant-id": tenantId },
      });
      if (res.status === 404) {
        setSite(null);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("No se pudo cargar el sitio");
      const data = await res.json();
      setSite(data.site as SiteData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [siteId, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        Cargando sitio…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy mb-2">Error</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

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

  return <SiteReviewPanel site={site} tenantId={tenantId} onRefresh={load} />;
}
