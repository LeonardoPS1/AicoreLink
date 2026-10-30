export interface VerticalInfo {
  slug: string;
  name: string;
  tagline: string;
  painPoints: string[];
  features: string[];
}

export interface ComunaInfo {
  slug: string;
  name: string;
  region: string;
}

export const VERTICALS: VerticalInfo[] = [
  {
    slug: "barberia",
    name: "Barbería",
    tagline: "Tu barbería atiende por WhatsApp las 24 horas",
    painPoints: [
      "Pierdes citas porque no respondes a tiempo",
      "Los clientes no recuerdan sus reservas",
      "No tienes tiempo para responder mensajes mientras cortas",
    ],
    features: [
      "Agenda de citas por WhatsApp",
      "Recordatorios automáticos",
      "Chat IA que responde precios y horarios",
    ],
  },
  {
    slug: "clinica",
    name: "Clínica",
    tagline: "Tu clínica gestiona pacientes por WhatsApp",
    painPoints: [
      "Los pacientes olvidan sus citas",
      "Las recepcionistas se saturan con consultas repetitivas",
      "No hay seguimiento post-consulta",
    ],
    features: [
      "Agenda médica por WhatsApp",
      "Recordatorios de cita",
      "Respuestas automáticas sobre servicios y horarios",
    ],
  },
  {
    slug: "taller",
    name: "Taller",
    tagline: "Tu taller informa el estado del vehículo por WhatsApp",
    painPoints: [
      "Los clientes llaman constantemente para saber el estado",
      "Se pierden presupuestos por falta de seguimiento",
      "No hay recordatorio de mantenciones",
    ],
    features: [
      "Estado del vehículo por WhatsApp",
      "Presupuestos automáticos",
      "Recordatorios de mantención",
    ],
  },
  {
    slug: "profesional",
    name: "Profesional",
    tagline: "Tu consulta profesional atiende por WhatsApp",
    painPoints: [
      "Pierdes clientes por no responder consultas rápido",
      "No tienes agenda online",
      "Las consultas iniciales consumen tiempo",
    ],
    features: [
      "Agenda de consultas por WhatsApp",
      "Respuestas automáticas a consultas frecuentes",
      "Confirmación y recordatorio de citas",
    ],
  },
];

export const COMUNAS: ComunaInfo[] = [
  { slug: "santiago", name: "Santiago", region: "Metropolitana" },
  { slug: "providencia", name: "Providencia", region: "Metropolitana" },
  { slug: "las-condes", name: "Las Condes", region: "Metropolitana" },
  { slug: "nunoa", name: "Ñuñoa", region: "Metropolitana" },
  { slug: "vitacura", name: "Vitacura", region: "Metropolitana" },
  { slug: "maipu", name: "Maipú", region: "Metropolitana" },
  { slug: "la-florida", name: "La Florida", region: "Metropolitana" },
  { slug: "puente-alto", name: "Puente Alto", region: "Metropolitana" },
];

export function getVertical(slug: string): VerticalInfo | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}

export function getComuna(slug: string): ComunaInfo | undefined {
  return COMUNAS.find((c) => c.slug === slug);
}

export function generateStaticParams(): { rubro: string; comuna: string }[] {
  const params: { rubro: string; comuna: string }[] = [];
  for (const v of VERTICALS) {
    for (const c of COMUNAS) {
      params.push({ rubro: v.slug, comuna: c.slug });
    }
  }
  return params;
}