"use client";

import { useEffect, useState } from "react";

interface EvalMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
}

export default function AIEvaluationPage() {
  const [metrics, setMetrics] = useState<EvalMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((tenants) => {
        if (Array.isArray(tenants) && tenants.length > 0) {
          const tid = tenants[0].id;
          setTenantId(tid);
          // Fetch corrections and usage data for evaluation
          Promise.all([
            fetch(`/api/tenants/${tid}/corrections`).then((r) => r.json()),
            fetch(`/api/tenants/${tid}/usage`).then((r) => r.json()),
          ]).then(([corrections, usage]) => {
            const totalCorrections = Array.isArray(corrections) ? corrections.length : 0;
            const totalMessages = Array.isArray(usage)
              ? usage.reduce((sum: number, u: any) => sum + (u.messagesIn || 0) + (u.messagesOut || 0), 0)
              : 0;
            const correctionRate = totalMessages > 0 ? ((totalCorrections / totalMessages) * 100).toFixed(1) : "0";

            setMetrics([
              { label: "Correcciones totales", value: totalCorrections },
              { label: "Mensajes procesados", value: totalMessages },
              { label: "Tasa de corrección", value: `${correctionRate}%` },
              { label: "Periodos de uso", value: Array.isArray(usage) ? usage.length : 0 },
            ]);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Evaluación Continua IA</h1>
        <p className="text-sm text-slate-500 mt-1">
          Métricas de calidad y rendimiento del asistente
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase text-slate-500">{m.label}</p>
            <p className="mt-1 text-2xl font-bold text-navy">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-navy mb-4">Recomendaciones</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-amber-500">⚠️</span>
            Si la tasa de corrección supera el 10%, revisar el prompt del asistente.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✅</span>
            Agregar más correcciones en el Modo Aprendizaje para mejorar respuestas.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">ℹ️</span>
            Revisar las métricas de uso para identificar patrones de alto consumo.
          </li>
        </ul>
      </div>
    </div>
  );
}
