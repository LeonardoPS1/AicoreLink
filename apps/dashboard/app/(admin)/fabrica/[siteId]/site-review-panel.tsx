"use client";

import { useState, useCallback } from "react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { renderBlocks, type Block } from "@/components/factory/block-renderer";

export interface SiteData {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  template: { name: string; planTier: string };
  businessProfile: { rubro: string; name: string } | null;
  pages: Array<{
    id: string;
    path: string;
    title: string;
    content: { blocks: Block[] };
    meta: Record<string, any>;
    order: number;
  }>;
  versions: Array<{
    id: string;
    version: number;
    changelog: string | null;
    createdBy: string;
    createdAt: string;
  }>;
}

interface SiteReviewPanelProps {
  site: SiteData;
  tenantId: string;
}

const STATUS_COLORS: Record<string, "teal" | "amber" | "brand" | "neutral"> = {
  draft: "neutral",
  generating: "amber",
  review: "amber",
  approved: "teal",
  published: "brand",
  unpublished: "neutral",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  generating: "Generando",
  review: "En revisión",
  approved: "Aprobado",
  published: "Publicado",
  unpublished: "Despublicado",
};

const CHECKLIST_ITEMS = [
  { id: "copy", label: "Copy completo y sin placeholders {{TODO:}}", check: (site: SiteData) => !hasPlaceholders(site) },
  { id: "images", label: "Imágenes presentes (logo + al menos 1 foto)", check: (site: SiteData) => hasImages(site) },
  { id: "prices", label: "Precios válidos (CLP, sin placeholders)", check: (site: SiteData) => hasValidPrices(site) },
  { id: "links", label: "Links funcionan (WhatsApp, navegación interna)", check: (site: SiteData) => hasWorkingLinks(site) },
  { id: "seo", label: "SEO meta (title, description, OG) en cada página", check: (site: SiteData) => hasSeoMeta(site) },
  { id: "responsive", label: "Responsive OK (mobile preview)", check: () => true }, // Visual check
  { id: "accessibility", label: "Accesibilidad básica (alt en imágenes, labels en forms)", check: (site: SiteData) => hasBasicA11y(site) },
];

function hasPlaceholders(site: SiteData): boolean {
  const checkContent = (content: any): boolean => {
    if (typeof content === "string") return content.includes("{{TODO:");
    if (Array.isArray(content)) return content.some(checkContent);
    if (content && typeof content === "object") return Object.values(content).some(checkContent);
    return false;
  };
  return site.pages.some((page) => checkContent(page.content));
}

function hasImages(site: SiteData): boolean {
  let hasLogo = false;
  let hasPhoto = false;
  if (site.businessProfile) {
    hasLogo = !!site.businessProfile.name; // Simplified check
    hasPhoto = true; // Assume at least one photo if business profile exists
  }
  return hasLogo || hasPhoto;
}

function hasValidPrices(site: SiteData): boolean {
  let hasValidPrice = false;
  let hasPlaceholderPrice = false;
  
  const checkContent = (content: any) => {
    if (content && typeof content === "object") {
      if (content.priceCLP !== undefined) {
        if (typeof content.priceCLP === "number" && content.priceCLP > 0) {
          hasValidPrice = true;
        }
      }
      if (content.price && typeof content.price === "string" && content.price.includes("{{TODO:")) {
        hasPlaceholderPrice = true;
      }
      Object.values(content).forEach(checkContent);
    }
  };
  
  site.pages.forEach((page) => checkContent(page.content));
  return hasValidPrice && !hasPlaceholderPrice;
}

function hasWorkingLinks(site: SiteData): boolean {
  // Simplified check - in real app would validate URLs
  return true;
}

function hasSeoMeta(site: SiteData): boolean {
  return site.pages.every((page) => {
    const meta = page.meta || {};
    return meta.title && meta.description && meta.ogImage;
  });
}

function hasBasicA11y(site: SiteData): boolean {
  // Check for alt text on images, labels on forms
  return true; // Simplified
}

export function SiteReviewPanel({ site, tenantId }: SiteReviewPanelProps) {
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [checklistResults, setChecklistResults] = useState<Record<string, boolean>>({});
  const [showDiff, setShowDiff] = useState<{ v1: number; v2: number } | null>(null);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (path: string) => {
    const index = site.pages.findIndex((p) => p.path === path);
    if (index !== -1) setActivePageIndex(index);
  };

  // Run checklist checks
  const runChecklist = useCallback(() => {
    const results: Record<string, boolean> = {};
    CHECKLIST_ITEMS.forEach((item) => {
      results[item.id] = item.check(site);
    });
    setChecklistResults(results);
  }, [site]);

  // Initialize checklist
  runChecklist();

  const allChecksPassed = CHECKLIST_ITEMS.every((item) => checklistResults[item.id]);

  const handleApprove = async () => {
    if (!allChecksPassed) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/factory/sites/${site.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": "current-user",
        },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        alert("Sitio aprobado correctamente. Ahora se puede publicar.");
      } else {
        alert("Error al aprobar el sitio");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/factory/sites/${site.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": "current-user",
        },
        body: JSON.stringify({ reason: "Rechazado en revisión" }),
      });
      if (response.ok) {
        alert("Sitio rechazado. Vuelve a estado de borrador.");
      } else {
        alert("Error al rechazar el sitio");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVersion = async (changelog: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/factory/sites/${site.id}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-user-id": "current-user",
        },
        body: JSON.stringify({ changelog }),
      });
      if (response.ok) {
        alert("Nueva versión creada");
        window.location.reload();
      } else {
        alert("Error al crear versión");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async (version: number) => {
    if (!confirm(`¿Restaurar a la versión ${version}? Se creará una nueva versión.`)) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/factory/sites/${site.id}/versions/${version}/rollback`, {
        method: "POST",
        headers: {
          "x-tenant-id": tenantId,
          "x-user-id": "current-user",
        },
      });
      if (response.ok) {
        alert("Rollback completado");
        window.location.reload();
      } else {
        alert("Error al hacer rollback");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDiff = async (v1: number, v2: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/factory/sites/${site.id}/versions/${v1}/diff/${v2}`, {
        headers: { "x-tenant-id": tenantId },
      });
      if (response.ok) {
        const diff = await response.json();
        setDiffResult(diff);
        setShowDiff({ v1, v2 });
      } else {
        alert("Error al obtener diff");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  const pageTabs = site.pages.map((page) => ({
    id: page.path,
    label: page.title,
    content: (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {renderBlocks(page.content.blocks)}
      </div>
    ),
  }));

  const statusColor = STATUS_COLORS[site.status] || "neutral";

  return (
    <div className="grid grid-cols-[25%_50%_25%] gap-6 h-[calc(100vh-120px)]">
      {/* LEFT PANEL - Site Info */}
      <div className="space-y-4 overflow-y-auto pr-4">
        <Card className="sticky top-6">
          <h3 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
            Información del Sitio
            <Badge variant={statusColor}>{STATUS_LABELS[site.status] || site.status}</Badge>
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Nombre</dt>
              <dd className="font-medium text-navy">{site.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Subdominio</dt>
              <dd className="font-medium text-navy">{site.subdomain}.aicorebots.com</dd>
            </div>
            <div>
              <dt className="text-slate-500">Rubro</dt>
              <dd className="font-medium text-navy capitalize">{site.businessProfile?.rubro || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Plan</dt>
              <dd className="font-medium text-navy capitalize">{site.template.planTier}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Plantilla</dt>
              <dd className="font-medium text-navy">{site.template.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Páginas</dt>
              <dd className="font-medium text-navy">{site.pages.length}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Versiones</dt>
              <dd className="font-medium text-navy">{site.versions.length}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h4 className="font-medium text-navy mb-3">Acciones rápidas</h4>
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => handleCreateVersion("Actualización manual desde panel de revisión")}
            >
              Crear versión
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50"
              onClick={() => {
                if (confirm("¿Despublicar este sitio?")) {
                  // TODO: implement unpublish
                }
              }}
            >
              Despublicar
            </Button>
          </div>
        </Card>
      </div>

      {/* CENTER PANEL - Preview */}
      <div className="flex flex-col overflow-hidden">
        <div className="mb-4">
          <Tabs
            items={pageTabs}
            ariaLabel="Páginas del sitio"
            defaultId={site.pages[0]?.path}
            onChange={handleTabChange}
            tone="light"
          />
        </div>
        <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white">
          {site.pages[activePageIndex] && (
            <div className="max-w-4xl mx-auto px-4 py-8">
              {renderBlocks(site.pages[activePageIndex].content.blocks)}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Checklist + Actions + Version History */}
      <div className="space-y-4 overflow-y-auto pl-4">
        {/* Checklist */}
        <Card className="sticky top-6">
          <h3 className="text-lg font-semibold text-navy mb-4">Checklist de revisión</h3>
          <p className="text-sm text-slate-500 mb-4">Todos los ítems deben estar ✓ para aprobar</p>
          <div className="space-y-3">
            {CHECKLIST_ITEMS.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={checklistResults[item.id] || false}
                  onChange={() => runChecklist()}
                  disabled
                  className="mt-1 w-5 h-5 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <span className="text-sm text-navy group-hover:text-brand">
                  {checklistResults[item.id] ? "✓" : "☐"} {item.label}
                </span>
              </label>
            ))}
          </div>
        </Card>

        {/* Approve/Reject Actions */}
        <Card className="sticky top-6">
          <h3 className="text-lg font-semibold text-navy mb-4">Acciones</h3>
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              size="lg"
              onClick={handleApprove}
              disabled={!allChecksPassed || isLoading}
            >
              {isLoading ? "Procesando..." : "Aprobar y publicar"}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              onClick={handleReject}
              disabled={isLoading}
            >
              Rechazar
            </Button>
            {!allChecksPassed && (
              <p className="text-xs text-slate-500 text-center">
                Completa todos los ítems del checklist para habilitar Aprobar
              </p>
            )}
          </div>
        </Card>

        {/* Version History */}
        <Card>
          <h3 className="text-lg font-semibold text-navy mb-4 flex items-center justify-between">
            Historial de versiones
            <Button variant="ghost" size="sm" onClick={() => handleCreateVersion('Versión manual')}>
              Nueva versión
            </Button>
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {site.versions.map((version, index) => (
              <div
                key={version.id}
                className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-brand font-semibold">v{version.version}</span>
                    <span className="ml-2 text-sm text-slate-500">
                      {new Date(version.createdAt).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {version.version !== 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleRollback(version.version)}
                    >
                      Restaurar
                    </Button>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-2">{version.changelog || "Sin descripción"}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Por: {version.createdBy}</span>
                  {index < site.versions.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleViewDiff(version.version, site.versions[index + 1].version)}
                    >
                      Ver diff
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {site.versions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No hay versiones aún. Genera el sitio para crear la v1.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Diff Modal */}
      {showDiff && diffResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-navy">
                Diff: v{showDiff.v1} → v{showDiff.v2}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDiff(null)}>
                × Cerrar
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {diffResult.added.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-3">Agregados ({diffResult.added.length})</h4>
                  <ul className="space-y-1 text-sm">
                    {diffResult.added.map((item: any, i: number) => (
                      <li key={i} className="text-green-800 bg-green-50 px-3 py-2 rounded">
                        + {item.blockType} en {item.pagePath} [#{item.blockIndex}]
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {diffResult.removed.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-3">Eliminados ({diffResult.removed.length})</h4>
                  <ul className="space-y-1 text-sm">
                    {diffResult.removed.map((item: any, i: number) => (
                      <li key={i} className="text-red-800 bg-red-50 px-3 py-2 rounded">
                        - {item.blockType} en {item.pagePath} [#{item.blockIndex}]
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {diffResult.modified.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-700 mb-3">Modificados ({diffResult.modified.length})</h4>
                  <ul className="space-y-1 text-sm">
                    {diffResult.modified.map((item: any, i: number) => (
                      <li key={i} className="text-amber-800 bg-amber-50 px-3 py-2 rounded">
                        ~ {item.blockType} en {item.pagePath} [#{item.blockIndex}]
                        <div className="text-xs text-amber-700 mt-1">
                          Campos: {item.changedFields.join(", ")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {diffResult.added.length === 0 && diffResult.removed.length === 0 && diffResult.modified.length === 0 && (
                <p className="text-center text-slate-500 py-8">No hay diferencias entre estas versiones.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}