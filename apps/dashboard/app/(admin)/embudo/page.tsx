import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Embudo de conversión",
  description: "Visitas → CTA → Lead → Herramientas → Demo",
};

type StageRow = {
  stage: string;
  total: string | number;
  breakdown?: Array<{ label: string; value: string | number; property?: string }>;
};

// Mock data for the funnel dashboard (R51). Real persistence comes in Phase 4 (E4).
const MOCK_STAGES: StageRow[] = [
  {
    stage: "Visitas",
    total: 12500,
  },
  {
    stage: "CTA clicks",
    total: 3200,
    breakdown: [
      { label: "hero", value: 1800 },
      { label: "planes-growth", value: 900 },
      { label: "header", value: 500 },
    ],
  },
  {
    stage: "Form submits",
    total: 480,
    breakdown: [
      { label: "barberia", value: 180 },
      { label: "taller", value: 150 },
      { label: "estudio", value: 100 },
      { label: "inmobiliaria", value: 50 },
    ],
  },
  {
    stage: "Tools start",
    total: 650,
    breakdown: [
      { label: "calculadora", value: 400 },
      { label: "test-atencion", value: 250 },
    ],
  },
  {
    stage: "Tools finish",
    total: 420,
    breakdown: [
      { label: "calculadora", value: 280, property: "monthlyLost: 260.000" },
      { label: "test-atencion", value: 140, property: "score: 75" },
    ],
  },
  {
    stage: "Demo messages",
    total: 180,
    breakdown: [
      { label: "peluqueria", value: 70 },
      { label: "taller", value: 60 },
      { label: "estudio", value: 50 },
    ],
  },
  {
    stage: "WhatsApp clicks",
    total: 2100,
    breakdown: [
      { label: "sticky", value: 800 },
      { label: "calculadora", value: 500 },
      { label: "test", value: 350 },
      { label: "demo", value: 250 },
      { label: "contacto", value: 200 },
    ],
  },
];

function formatNumber(n: string | number): string {
  const num = typeof n === "string" ? parseInt(n, 10) : n;
  return num.toLocaleString("es-CL");
}

function StageCard({ stage, total, breakdown }: StageRow) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-navy">{stage}</h3>
        <span className="text-2xl font-bold text-brand">{formatNumber(total)}</span>
      </div>
      {breakdown && breakdown.length > 0 && (
        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {breakdown.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
            >
              <Badge variant="neutral">{item.label}</Badge>
              <span className="font-medium text-slate-700">{formatNumber(item.value)}</span>
              {item.property && (
                <Badge variant="teal" className="text-xs ml-auto">
                  {item.property}
                </Badge>
              )}
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}

export default function EmbudoPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-navy">Embudo de conversión</h1>
        <p className="mt-2 text-slate-600">
          Visitas → CTA → Lead → Herramientas → Demo
        </p>
      </header>

      <section aria-label="Funnel stages" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MOCK_STAGES.map((stageData) => (
          <StageCard key={stageData.stage} {...stageData} />
        ))}
      </section>
    </div>
  );
}