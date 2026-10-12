/**
 * Landing verticals — the service businesses AicoreLink targets.
 * Plan: docs/superpowers/plans/2026-10-12-aicorelink-web-master-build-plan.md (§10).
 *
 * Voice rules: neutral Chilean Spanish, always tuteo, never voseo.
 *
 * Scope note: these are businesses that sell services, time or consultations.
 * Catalog / e-commerce stores are explicitly out of scope.
 */

export type VerticalHighlight = {
  /** Short capability claim shown big (never a fabricated client metric). */
  value: string;
  /** Short label clarifying the claim. */
  label: string;
};

export type Vertical = {
  id: string;
  /** Tab label in the verticals section. */
  tab: string;
  /** Emoji shown next to the tab label. */
  icon: string;
  /** Singular noun used in the contextual CTA. */
  singular: string;
  /** The specific pain this business lives with. */
  pain: string;
  /** Short punchy anchor line. */
  anchor: string;
  /** What the AI-powered site does for this business. */
  solution: string;
  /** Contextual call to action; must contain `singular`. */
  ctaLabel: string;
  /** Capability highlight (no invented client numbers). */
  highlight: VerticalHighlight;
};

export const verticals: Vertical[] = [
  {
    id: "barberia",
    tab: "Barberías",
    icon: "💈",
    singular: "Barbería",
    pain: "Cada mensaje sin responder es un turno que se va a otra barbería.",
    anchor: "Nunca más un turno perdido",
    solution:
      "La IA responde precios, horarios y disponibilidad al instante, y agenda el turno sola, incluso mientras estás cortando el pelo.",
    ctaLabel: "Quiero esto para mi Barbería",
    highlight: { value: "24/7", label: "Responde y agenda sola" },
  },
  {
    id: "taller",
    tab: "Talleres",
    icon: "🔧",
    singular: "Taller mecánico",
    pain: "Estás debajo del auto, no puedes atender. El cliente llama a otro taller.",
    anchor: "El cliente no espera a que te limpies las manos",
    solution:
      "Mientras trabajas, el asistente cotiza, agenda el ingreso y te avisa cuando hay un presupuesto listo para aprobar.",
    ctaLabel: "Quiero esto para mi Taller mecánico",
    highlight: { value: "Al instante", label: "Cotiza y agenda ingresos" },
  },
  {
    id: "abogado",
    tab: "Abogados",
    icon: "⚖️",
    singular: "Estudio jurídico",
    pain: "Consultas que no filtran tu tiempo valen menos que cero.",
    anchor: "Tu tiempo vale, las consultas filtradas también",
    solution:
      "La IA hace las preguntas de intake, separa los casos reales del ruido y te entrega el resumen listo para que decidas.",
    ctaLabel: "Quiero esto para mi Estudio jurídico",
    highlight: { value: "Filtra", label: "Separa consultas reales del ruido" },
  },
  {
    id: "inmobiliaria",
    tab: "Inmobiliarias",
    icon: "🏠",
    singular: "Inmobiliaria",
    pain: "El que responde primero, cierra. El lead de las 22:00 se va en 5 minutos.",
    anchor: "El que responde primero, cierra",
    solution:
      "Tu sitio capta el interés, la IA califica al comprador y agenda la visita antes de que se enfríe la intención.",
    ctaLabel: "Quiero esto para mi Inmobiliaria",
    highlight: { value: "En segundos", label: "Atiende el lead de las 22:00" },
  },
  {
    id: "clinica",
    tab: "Clínicas",
    icon: "🩺",
    singular: "Clínica",
    pain: "Recepción ocupada = paciente que no vuelve a llamar.",
    anchor: "Recepción que nunca está ocupada",
    solution:
      "El asistente agenda turnos, envía recordatorios y responde dudas administrativas sin sumar carga a recepción.",
    ctaLabel: "Quiero esto para mi Clínica",
    highlight: { value: "Automático", label: "Agenda sin sumar a recepción" },
  },
  {
    id: "domicilio",
    tab: "A domicilio",
    icon: "🚚",
    singular: "Servicio a domicilio",
    pain: "Mientras trabajas, tu teléfono es tu mejor vendedor y está apagado.",
    anchor: "Tu mejor vendedor, siempre encendido",
    solution:
      "La IA toma el pedido, confirma zona y horario, y te deja la ruta ordenada para que solo ejecutes.",
    ctaLabel: "Quiero esto para mi Servicio a domicilio",
    highlight: { value: "Siempre activo", label: "Contesta mientras trabajas" },
  },
];
