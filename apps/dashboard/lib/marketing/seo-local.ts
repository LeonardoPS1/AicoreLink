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
  {
    slug: "peluqueria",
    name: "Peluquería",
    tagline: "Tu peluquería gestiona citas por WhatsApp",
    painPoints: [
      "Los clientes no recuerdan sus citas",
      "Pierdes tiempo respondiendo consultas repetitivas",
      "No tienes control de tu agenda",
    ],
    features: [
      "Agenda de citas por WhatsApp",
      "Recordatorios automáticos",
      "Respuestas sobre precios y servicios",
    ],
  },
  {
    slug: "restaurante",
    name: "Restaurante",
    tagline: "Tu restaurante recibe reservas por WhatsApp",
    painPoints: [
      "Las llamadas interrumpen el servicio",
      "No hay seguimiento de reservas",
      "Los clientes no confirman asistencia",
    ],
    features: [
      "Reservas por WhatsApp",
      "Confirmación y recordatorio",
      "Menú digital automático",
    ],
  },
  {
    slug: "gimnasio",
    name: "Gimnasio",
    tagline: "Tu gimnasio gestiona membresías por WhatsApp",
    painPoints: [
      "Los socios olvidan pagar",
      "No hay seguimiento de asistencia",
      "Las consultas sobre horarios saturan recepción",
    ],
    features: [
      "Recordatorios de pago",
      "Información de horarios y clases",
      "Seguimiento de membresías",
    ],
  },
  {
    slug: "veterinaria",
    name: "Veterinaria",
    tagline: "Tu veterinaria atiende consultas por WhatsApp",
    painPoints: [
      "Los dueños de mascotas llaman constantemente",
      "No hay recordatorio de vacunas",
      "Se pierden citas por falta de confirmación",
    ],
    features: [
      "Agenda de citas por WhatsApp",
      "Recordatorios de vacunas y controles",
      "Respuestas sobre servicios y horarios",
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
  { slug: "san-miguel", name: "San Miguel", region: "Metropolitana" },
  { slug: "macul", name: "Macul", region: "Metropolitana" },
  { slug: "penalolen", name: "Peñalolén", region: "Metropolitana" },
  { slug: "la-reina", name: "La Reina", region: "Metropolitana" },
  { slug: "recoleta", name: "Recoleta", region: "Metropolitana" },
  { slug: "independencia", name: "Independencia", region: "Metropolitana" },
  { slug: "conchali", name: "Conchalí", region: "Metropolitana" },
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