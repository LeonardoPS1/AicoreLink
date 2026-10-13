"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      const data = await res.json();
      setSites(data.sites ?? []);
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
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-navy">Fábrica de sitios</h1>
        <p className="text-sm text-slate-500">
          Revisá, aprobá y publicá los sitios generados para cada negocio.
        </p>
      </header>

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
            <input
              data-testid="filter-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre o subdominio"
              className="h-9 w-56 rounded-lg border border-slate-300 bg-white px-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
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
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Cargando sitios…
                </td>
              </tr>
            )}
            {!loading && sites.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No hay sitios que coincidan con los filtros.
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
                    <div className="font-medium text-navy">{site.name}</div>
                    <div className="text-xs text-slate-400">
                      {site.customDomain ?? `${site.subdomain}.aicorelink.aicorebots.com`}
                    </div>
                    {site.tenant && (
                      <div className="text-xs text-slate-400">Cliente: {site.tenant.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {site.rubro ? RUBRO_LABELS[site.rubro] ?? site.rubro : "—"}
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
                    <Link
                      href={`/fabrica/${site.id}?tenant=${encodeURIComponent(site.tenant?.id ?? "")}`}
                      className={cn("text-sm font-medium text-brand hover:text-brand-dark")}
                    >
                      Revisar
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
