"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function AssistantConfigPage() {
  const params = useParams();
  const tenantId = params?.id as string ?? "default";
  const [config, setConfig] = useState({
    name: "Aicore Assistant",
    tone: "amable",
    language: "es",
    greeting: "",
    forbiddenTopics: [] as string[],
    autoReply: true,
    handoffKeywords: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/tenants/${tenantId}/assistant`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setConfig({
            name: data.name ?? "Aicore Assistant",
            tone: data.tone ?? "amable",
            language: data.language ?? "es",
            greeting: data.greeting ?? "",
            forbiddenTopics: data.forbiddenTopics ?? [],
            autoReply: data.autoReply ?? true,
            handoffKeywords: data.handoffKeywords ?? [],
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tenantId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/assistant`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        alert("Configuración guardada");
      } else {
        alert("Error al guardar");
      }
    } catch {
      alert("Error de conexión");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configuración del Asistente</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del asistente</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tono</label>
          <select
            value={config.tone}
            onChange={(e) => setConfig({ ...config, tone: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="amable">Amable</option>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="profesional">Profesional</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Idioma</label>
          <select
            value={config.language}
            onChange={(e) => setConfig({ ...config, language: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="es">Español</option>
            <option value="en">Inglés</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Saludo inicial</label>
          <textarea
            value={config.greeting}
            onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Temas prohibidos (separados por coma)</label>
          <input
            type="text"
            value={config.forbiddenTopics.join(", ")}
            onChange={(e) =>
              setConfig({
                ...config,
                forbiddenTopics: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Palabras clave de derivación (separadas por coma)</label>
          <input
            type="text"
            value={config.handoffKeywords.join(", ")}
            onChange={(e) =>
              setConfig({
                ...config,
                handoffKeywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.autoReply}
            onChange={(e) => setConfig({ ...config, autoReply: e.target.checked })}
            id="autoReply"
          />
          <label htmlFor="autoReply" className="text-sm">Respuesta automática activada</label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}