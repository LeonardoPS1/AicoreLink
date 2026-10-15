"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Factory, Search, ExternalLink, Building2, User, Briefcase } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

interface AdminSite {
  id: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  status: string;
  rubro: string | null;
  businessName: string | null;
  planTier: string | null;
  currentVersionId: string | null;
  updatedAt: string;
  publishedAt: string | null;
  tenant: { id: string; name: string } | null;
}

interface AdminSitesResponse {
  sites: AdminSite[];
  stats?: {
    total: number;
    review: number;
    published: number;
    draft: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  generating: "Generando",
  review: "En revisión",
  approved: "Aprobado",
  publishing: "Publicando",
  published: "Publicado",
  unpublished: "Despublicado",
};

const STATUS_VARIANTS: Record<string, "brand" | "teal" | "amber" | "neutral"> = {
  draft: "neutral",
  generating: "amber",
  review: "amber",
  approved: "brand",
  publishing: "brand",
  published: "teal",
  unpublished: "neutral",
};

const RUBRO_LABELS: Record<string, string> = {
  barberia: "Barbería",
  taller: "Taller",
  profesional: "Profesional",
  clinica: "Clínica",
  inmobiliaria: "Inmobiliaria",
  domicilio: "Domicilio",
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  elite: "Elite",
};

function RubroIcon({ rubro }: { rubro: string | null }) {
  switch (rubro) {
    case "taller":
    case "inmobiliaria":
      return <Building2 className="w-4 h-4" />;
    case "barberia":
    case "clinica":
    case "domicilio":
    case "profesional":
    default:
      return <User className="w-4 h-4" />;
  }
}

const STATUS_OPTIONS = [
  "draft",
  "generating",
  "review",
  "approved",
  "publishing",
  "published",
  "unpublished",
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function FabricaPage() {
  const [sites, setSites] = useState<AdminSite[]>([]);
  const [stats, setStats] = useState<AdminSitesResponse["stats"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [rubroFilter, setRubroFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const loadSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (rubroFilter) params.set("rubro", rubroFilter);
      if (search.trim()) params.set("q", search.trim());
      const query = params.toString();
      const res = await fetch(`/api/admin/sites${query ? `?${query}` : ""}`);
      if (!res.ok) throw new Error("No se pudo cargar la lista de sitios");
      const data: AdminSitesResponse = await res.json();
      setSites(data.sites ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, rubroFilter, search]);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  const allSelected = sites.length > 0 && selected.size === sites.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(sites.map((s) => s.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function approveSelected() {
    const targets = sites.filter(
      (s) => selected.has(s.id) && s.status === "review" && s.tenant
    );
    if (targets.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await Promise.all(
        targets.map((site) =>
          fetch(`/api/factory/sites/${site.id}/approve`, {
            method: "POST",
            headers: { "x-tenant-id": site.tenant!.id, "x-user-id": "current-user" },
          })
        )
      );
      setSelected(new Set());
      await loadSites();
    } catch {
      setError("No se pudieron aprobar todos los sitios seleccionados");
    } finally {
      setBusy(false);
    }
  }

  const selectedCount = useMemo(
    () => sites.filter((s) => selected.has(s.id) && s.status === "review").length,
    [sites, selected]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fábrica de sitios"
        description="Revisá, aprobá y publicá los sitios generados para cada negocio."
        icon={Factory}
        data-testid="fabrica-page-header"
      />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="fabrica-kpis">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Factory}
            tone="neutral"
          />
          <StatCard
            label="En revisión"
            value={stats.review}
            icon={User}
            tone="amber"
            hint="Pendientes de aprobación"
          />
          <StatCard
            label="Publicados"
            value={stats.published}
            icon={ExternalLink}
            tone="teal"
            hint="Online y accesibles"
          />
          <StatCard
            label="Borradores"
            value={stats.draft}
            icon={Briefcase}
            tone="brand"
            hint="En construcción"
          />
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Estado
            <select
              data-testid="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Rubro
            <select
              data-testid="filter-rubro"
              value={rubroFilter}
              onChange={(e) => setRubroFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="">Todos</option>
              {Object.entries(RUBRO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                data-testid="filter-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o subdominio"
                className="h-9 w-56 rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            </div>
          </label>

          <Button
            variant="secondary"
            size="sm"
            data-testid="bulk-approve"
            disabled={busy || selectedCount === 0}
            onClick={() => void approveSelected()}
          >
            Aprobar seleccionados{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </Button>
        </div>
      </Card>

      {error && (
        <div
          data-testid="fabrica-error"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" data-testid="fabrica-table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3">Sitio</th>
                <th className="px-4 py-3">Rubro</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Última publicación</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <tr key={`skeleton-${i}`} data-testid="fabrica-row-skeleton">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-4 rounded" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-16" /></td>
                    </tr>
                  ))}
                </>
              )}
              {!loading && sites.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <EmptyState
                      icon={Factory}
                      title="No hay sitios"
                      description="Aún no se han generado sitios para ningún negocio."
                    />
                  </td>
                </tr>
              )}
              {!loading &&
                sites.map((site) => (
                  <tr key={site.id} data-testid="fabrica-row" className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${site.name}`}
                        checked={selected.has(site.id)}
                        onChange={() => toggleOne(site.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={site.name} className="w-8 h-8 text-sm" />
                        <div>
                          <div className="font-medium text-navy">{site.name}</div>
                          <div className="text-xs text-slate-400">
                            {site.customDomain ?? `${site.subdomain}.aicorelink.aicorebots.com`}
                          </div>
                          {site.tenant && (
                            <div className="text-xs text-slate-400">Cliente: {site.tenant.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <RubroIcon rubro={site.rubro} />
                        {site.rubro ? RUBRO_LABELS[site.rubro] ?? site.rubro : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {site.planTier ? PLAN_LABELS[site.planTier] ?? site.planTier : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[site.status] ?? "neutral"}>
                        {STATUS_LABELS[site.status] ?? site.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(site.publishedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/fabrica/${site.id}?tenant=${encodeURIComponent(site.tenant?.id ?? "")}`}
                          className={cn("text-sm font-medium text-brand hover:text-brand-dark")}
                        >
                          Revisar
                        </Link>
                        {site.status === "published" && site.customDomain && (
                          <a
                            href={`https://${site.customDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-brand"
                            aria-label="Ver sitio publicado"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}