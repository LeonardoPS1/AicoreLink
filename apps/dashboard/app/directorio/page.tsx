"use client";

import { useEffect, useState } from "react";

interface Review {
  author: string;
  content: string;
  rating: number;
}

interface DirectoryEntry {
  id: string;
  name: string;
  slug: string;
  rubro?: string;
  comuna?: string;
  description?: string;
  testimonials: number;
  rating: number | null;
  reviews?: Review[];
}

const RUBROS = ["peluqueria", "clinica_dental", "restaurante", "taller_mecanico", "gimnasio", "veterinaria", "fotografia", "otro"];
const COMUNAS = ["santiago", "providencia", "las_condes", "vitacura", "nunoa", "macul", "la_florida", "penalolen"];

export default function DirectorioPage() {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rubro, setRubro] = useState("");
  const [comuna, setComuna] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (rubro) params.set("rubro", rubro);
    if (comuna) params.set("comuna", comuna);
    fetch(`/api/directory?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.directory ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [rubro, comuna]);

  const filtered = entries.filter((e) =>
    search ? e.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-navy">Directorio de negocios</h1>

      {/* Map placeholder */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-100 p-4 text-center">
        <p className="text-sm text-slate-500">
          📍 Mapa interactivo próximamente — los negocios se mostrarán en el mapa de Santiago
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar negocio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los rubros</option>
          {RUBROS.map((r) => (
            <option key={r} value={r}>{r.replace("_", " ")}</option>
          ))}
        </select>
        <select
          value={comuna}
          onChange={(e) => setComuna(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Todas las comunas</option>
          {COMUNAS.map((c) => (
            <option key={c} value={c}>{c.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Cargando...</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-navy">{entry.name}</h2>
              <p className="text-sm text-slate-500">{entry.rubro?.replace("_", " ") ?? "—"}</p>
              {entry.comuna && (
                <p className="text-xs text-slate-400 mt-1">{entry.comuna.replace("_", " ")}</p>
              )}
              <p className="mt-2 text-sm text-slate-600">{entry.description ?? ""}</p>
              {entry.rating && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-medium text-amber-500">
                    {"⭐".repeat(Math.round(entry.rating))}
                  </span>
                  <span className="text-xs text-slate-400">
                    {entry.rating.toFixed(1)} ({entry.testimonials} reseñas)
                  </span>
                </div>
              )}
              {entry.reviews && entry.reviews.length > 0 && (
                <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                  {entry.reviews.map((r, i) => (
                    <div key={i} className="text-xs text-slate-600">
                      <span className="font-medium">{r.author}</span>
                      <span className="text-amber-500 ml-1">{"⭐".repeat(r.rating)}</span>
                      <p className="mt-0.5 italic">&ldquo;{r.content}&rdquo;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-slate-500 py-8">No se encontraron negocios.</p>
      )}
    </div>
  );
}
