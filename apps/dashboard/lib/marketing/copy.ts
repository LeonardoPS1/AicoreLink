/**
 * Landing copy — single source of truth for all marketing text.
 * Source of truth: AicoreLink_Web_Plan_de_Ejecucion.md §10 and §23 (v2 copy).
 *
 * Keeping copy out of components lets us revise wording without touching JSX.
 * Voice rules (§10.1): close, neutral Chilean Spanish, always tuteo, never voseo.
 */

import type { LostRevenueInput } from "@/lib/tools/calculator";

export type NavItem = { label: string; href: string };
export type PainItem = { icon: string; title: string; description: string };
export type SolutionColumn = { icon: string; title: string; description: string };
export type Step = { title: string; description: string };
export type PlanId = "semilla" | "starter" | "growth" | "elite";
export type Plan = {
  id: PlanId;
  name: string;
  /** Monthly price in CLP. VAT is added separately (see `priceNote`). */
  priceCLP: number;
  /** Short note rendered next to the price ("+ IVA" / "sin costo"). */
  priceNote: string;
  forWho: string;
  /** Positioning line (§10.6). Reserved for the pricing redesign. */
  tagline: string;
  features: string[];
  ctaLabel: string;
  highlighted: boolean;
  /** Exactly one plan (Growth) is flagged as the most chosen. */
  bestSeller?: boolean;
  badge?: string;
};
export type FaqItem = { question: string; answer: string };
export type FooterGroup = { title: string; links: { label: string; href: string }[] };

/**
 * Calculator field metadata (§10.4). `name` is keyed to `LostRevenueInput`, so a
 * renamed input cannot silently drift away from the copy that labels it.
 */
export type CalculatorFieldName = keyof LostRevenueInput;
export type CalculatorField = {
  name: CalculatorFieldName;
  label: string;
  /** What the visitor types: raw count, percent (0–100), CLP, or "x out of 10". */
  unit: "count" | "percent" | "clp" | "perTen";
  placeholder: string;
  hint?: string;
};

/**
 * Illustrative example card in the `#casos` section. Deliberately not a client
 * quote/metric: it is labelled "Ejemplo" and attributed to a business type.
 */
export type TestimonialExample = {
  icon: string;
  business: string;
  situation: string;
  outcome: string;
  capability: string;
};

export type LandingCopy = {
  brand: { name: string; tagline: string };
  nav: NavItem[];
  header: { ctaLabel: string };
  hero: {
    eyebrow: string;
    headline: string;
    subhead: string;
    primaryCta: string;
    secondaryCta: string;
    trustLine: string;
  };
  trustBar: { statement: string; items: string[] };
  pains: { title: string; items: PainItem[]; closing: string };
  solution: { title: string; subtitle: string; columns: SolutionColumn[] };
  howItWorks: { title: string; subtitle: string; steps: Step[] };
  verticals: { title: string; subtitle: string; note: string; ctaTemplate: string };
  pricing: { title: string; subtitle: string; plans: Plan[]; note: string };
  testimonials: {
    title: string;
    subtitle: string;
    placeholderNotice: string;
    examples: TestimonialExample[];
  };
  faq: { title: string; subtitle: string; items: FaqItem[] };
  cta: {
    title: string;
    subtitle: string;
    primaryLabel: string;
    secondaryLabel: string;
    guarantee: string;
  };
  stickyWhatsApp: { label: string; message: string };
  calculator: {
    title: string;
    subtitle: string;
    fields: CalculatorField[];
    /** Sentence template; `{amount}` is replaced with a formatted CLP value. */
    resultTemplate: string;
    disclaimer: string;
    ctaLabel: string;
  };
  attentionTest: {
    title: string;
    subtitle: string;
    intro: string;
    yesLabel: string;
    noLabel: string;
    resultTitle: string;
    /** Score template; `{score}` is replaced with the computed 0..100 value. */
    scoreTemplate: string;
    gapsTitle: string;
    allClear: string;
    /** Stand-in for `[brechas]` when a perfect score leaves no gaps to list. */
    noGapsBrecha: string;
    disclaimer: string;
    ctaLabel: string;
    /** Suffix appended when the visitor arrives from the calculator with `?monto`. */
    amountSuffix: string;
  };
  footer: {
    tagline: string;
    ecosystem: FooterGroup;
    contact: FooterGroup;
    legal: string;
  };
};

export const copy: LandingCopy = {
  brand: {
    name: "AicoreLink",
    tagline: "Sitios web con IA para negocios que viven de sus clientes",
  },

  nav: [
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Rubros", href: "#rubros" },
    { label: "Planes", href: "#planes" },
    { label: "Preguntas", href: "#preguntas" },
  ],

  header: {
    ctaLabel: "Hablar con nosotros",
  },

  hero: {
    eyebrow: "Sitios web con IA para negocios que viven de sus clientes",
    headline: "Tu negocio atiende y capta clientes 24/7. Aunque tú estés trabajando.",
    subhead:
      "Creamos tu sitio web con IA que responde por WhatsApp, agenda citas y pide reseñas. Listo en días, sin que tengas que saber de tecnología.",
    primaryCta: "Quiero mi diagnóstico gratis",
    secondaryCta: "Ver cómo funciona",
    trustLine:
      "Ideal para barberías, talleres, estudios, inmobiliarias, clínicas y todo negocio de servicios.",
  },

  trustBar: {
    statement:
      "Más de 9 de cada 10 clientes elige al negocio que responde primero. Que sea el tuyo.",
    items: [
      "⚡ Responde en segundos",
      "🗓️ Agenda sola",
      "⭐ Consigue reseñas",
      "📱 Hecho para WhatsApp",
    ],
  },

  pains: {
    title: "Cada mensaje sin responder es un cliente que se va.",
    items: [
      {
        icon: "💬",
        title: "El cliente que no recibe respuesta en minutos le escribe a tu competencia.",
        description: "Tu sitio responde en segundos, a cualquier hora.",
      },
      {
        icon: "🌙",
        title: "Tu negocio cierra a las 19:00. Tus clientes, no.",
        description: "Atiende y agenda de noche y en fines de semana.",
      },
      {
        icon: "🔁",
        title: "Cada consulta repetida es tiempo que le quitas a tu trabajo.",
        description: "Responde horarios, precios y ubicación por ti.",
      },
      {
        icon: "🔎",
        title: "Tienes Instagram, pero cuando buscan en Google no apareces.",
        description: "Un sitio pensado para que te contacten, no solo para verse bien.",
      },
      {
        icon: "⏰",
        title: "La hora que no llega es plata que no vuelve.",
        description: "Recordatorios automáticos con confirmación.",
      },
      {
        icon: "⭐",
        title: "Atiendes bien, pero nadie lo ve en Google.",
        description: "Pedimos la reseña en el momento justo.",
      },
      {
        icon: "📞",
        title: "Estás con las manos ocupadas y suena el teléfono.",
        description: "Una recepcionista de voz atiende, toma el mensaje y te avisa.",
      },
      {
        icon: "🗂️",
        title: "WhatsApp aquí, agenda allá, planilla en otro lado.",
        description: "Todo en un solo lugar, con un reporte cada mes.",
      },
    ],
    closing:
      "Todos estos problemas tienen la misma causa: la atención no puede esperar. Y la misma solución.",
  },

  solution: {
    title: "Un sitio web que trabaja para tu negocio. No al revés.",
    subtitle: "Tres cosas que tu sitio hace solo, todos los días.",
    columns: [
      {
        icon: "📈",
        title: "Atrae",
        description:
          "Diseño pensado para convertir y aparecer en Google, con la información que tus clientes buscan: servicios, precios, ubicación y confianza.",
      },
      {
        icon: "🎯",
        title: "Convierte",
        description:
          "Formulario, botón de WhatsApp y asistente con IA que responde al instante, resuelve dudas y toma los datos del cliente.",
      },
      {
        icon: "🤖",
        title: "Atiende",
        description:
          "La IA agenda citas, envía recordatorios, pide reseñas automáticamente y te avisa cuando hace falta que intervengas.",
      },
    ],
  },

  howItWorks: {
    title: "Empieza a recibir clientes en pocos días",
    subtitle: "Sin formularios eternos ni reuniones interminables.",
    steps: [
      {
        title: "Conversamos 20 minutos",
        description: "Nos cuentas cómo trabajas y qué consultas se repiten.",
      },
      {
        title: "Armamos tu sitio en 48–72 h",
        description:
          "Con tu logo, tus servicios y tu estilo. Tú apruebas antes de publicar.",
      },
      {
        title: "Conectamos WhatsApp, agenda y reseñas",
        description: "Todo configurado por nosotros; tú no tocas nada técnico.",
      },
      {
        title: "Atiende por ti y te reportamos",
        description:
          "Cada mes recibes un resumen con consultas, citas y reseñas.",
      },
    ],
  },

  verticals: {
    title: "Hecho para negocios como el tuyo",
    subtitle:
      "Si tu negocio vende servicios, tiempo o consultas (no un catálogo de productos), esto es para ti.",
    note: "No es para tiendas con catálogo. Es para negocios que necesitan captar, convertir y atender.",
    ctaTemplate: "Quiero esto para mi {singular}",
  },

  pricing: {
    title: "Planes claros. Sin costos escondidos.",
    subtitle: "Todo incluido: diseño, hosting, WhatsApp y el asistente según tu plan.",
    // Monthly prices are CLP with VAT excluded; implementation amounts follow §23.
    plans: [
      {
        id: "semilla",
        name: "Semilla",
        priceCLP: 0,
        priceNote: "sin costo",
        forWho: "Negocio que recién parte",
        tagline: "Para tener presencia online hoy, sin costo.",
        features: [
          "1 página",
          "Botón de WhatsApp",
          "Formulario de contacto",
          'Sello "Hecho con AicoreLink"',
        ],
        ctaLabel: "Quiero mi diagnóstico gratis",
        highlighted: false,
      },
      {
        id: "starter",
        name: "Starter",
        priceCLP: 19990,
        priceNote: "+ IVA",
        forWho: "Negocio que arranca",
        tagline: "Para verte profesional y no perder mensajes.",
        features: [
          "3 páginas",
          "Formulario de contacto",
          "Chat básico con IA",
          "Implementación sin costo con permanencia de 6 meses",
        ],
        ctaLabel: "Quiero mi diagnóstico gratis",
        highlighted: false,
      },
      {
        id: "growth",
        name: "Growth",
        priceCLP: 49990,
        priceNote: "+ IVA",
        forWho: "Negocio que quiere crecer",
        tagline: "Para llenar tu agenda con reservas y reseñas automáticas.",
        features: [
          "5 páginas",
          "Calendario de citas",
          "Reseñas automáticas",
          "Notas de voz",
          "Derivación a tu equipo",
          "Implementación desde $49.990",
        ],
        ctaLabel: "Quiero mi diagnóstico gratis",
        highlighted: true,
        bestSeller: true,
        badge: "Más elegido",
      },
      {
        id: "elite",
        name: "Elite",
        priceCLP: 99990,
        priceNote: "+ IVA",
        forWho: "Negocio que quiere automatizar todo",
        tagline: "Para que nada se te escape: chat IA y recepcionista de voz.",
        features: [
          "Hasta 10 páginas",
          "Chat con IA completo",
          "Recepcionista de voz",
          "Todo lo de Growth, incluido",
          "Implementación desde $149.990",
        ],
        ctaLabel: "Quiero mi diagnóstico gratis",
        highlighted: false,
        badge: "Atención completa",
      },
    ],
    note: "Precios en pesos chilenos (CLP) más IVA. Puedes cancelar cuando quieras: tu dominio y tu contenido son tuyos.",
  },

  testimonials: {
    title: "Negocios que ya no pierden clientes",
    subtitle: "Resultados de negocios de servicios que automatizaron su atención.",
    placeholderNotice:
      "Sección en preparación: los casos se publican solo con autorización del cliente y datos verificados.",
    examples: [
      {
        icon: "💈",
        business: "Barbería",
        situation: "El dueño está cortando pelo y no puede mirar el teléfono.",
        outcome:
          "El asistente responde, muestra los horarios libres y confirma el turno por WhatsApp.",
        capability: "Atiende mientras trabajas",
      },
      {
        icon: "🔧",
        business: "Taller mecánico",
        situation: "Entran consultas de presupuesto durante toda la jornada.",
        outcome:
          "La IA toma los datos del vehículo y el problema, y agenda la revisión en el taller.",
        capability: "Filtra consultas solo",
      },
      {
        icon: "⚖️",
        business: "Estudio jurídico",
        situation: "Llegan consultas que ocupan tiempo sin ser casos reales.",
        outcome:
          "El asistente hace las preguntas iniciales, ordena la información y deriva lo urgente.",
        capability: "Ordena tu agenda",
      },
    ],
  },

  faq: {
    title: "Preguntas frecuentes",
    subtitle: "Lo que todo negocio pregunta antes de empezar.",
    items: [
      {
        question: "¿Necesito saber de tecnología?",
        answer: "No. Nosotros armamos, conectamos y mantenemos todo. Tú apruebas y listo.",
      },
      {
        question: "¿Qué pasa si quiero irme?",
        answer:
          "Tu dominio y tu contenido son tuyos. Te entregamos todo; solo respetas la permanencia si te regalamos la implementación.",
      },
      {
        question: "¿La IA puede decir algo incorrecto?",
        answer:
          "Solo responde con la información que tú aprobaste. Si no sabe algo, lo dice y te avisa. Tú defines qué temas no toca.",
      },
      {
        question: "¿Cuánto tardan en entregarme el sitio?",
        answer: "Entre 48 y 72 horas desde que nos entregas tus datos completos.",
      },
      {
        question: "¿Funciona con mi WhatsApp actual?",
        answer:
          "Depende del plan: puedes usar un número compartido o uno propio. Te recomendamos la mejor opción en el diagnóstico.",
      },
      {
        question: "¿Qué pasa con los datos de mis clientes?",
        answer:
          "Están aislados y solo se usan para atender a tu negocio. Firmamos un contrato de tratamiento de datos.",
      },
      {
        question: "¿Hay permanencia?",
        answer:
          "Solo cuando te regalamos la implementación (6 meses). En otros casos puedes cancelar con aviso.",
      },
      {
        question: "¿Y si no recibo consultas?",
        answer:
          "Garantía de 30 días: si no recibes consultas por tu sitio, no cobramos el segundo mes.",
      },
    ],
  },

  cta: {
    title: "Descubre cuántos clientes podrías estar perdiendo.",
    subtitle: "Te respondemos hoy por WhatsApp. Sin compromiso.",
    primaryLabel: "Quiero mi diagnóstico gratis",
    secondaryLabel: "Escribir por WhatsApp",
    guarantee:
      "Tu dominio es tuyo. Tu contenido es tuyo. Si algún día te vas, te llevas todo. Sin letra chica. Y si en 30 días no recibes consultas por tu sitio, no cobramos el segundo mes.",
  },

  stickyWhatsApp: {
    label: "¿Hablamos? 💬",
    message: "Hola, quiero un sitio web con IA para mi negocio.",
  },

  calculator: {
    title: "¿Cuánto te cuesta no responder?",
    subtitle:
      "Usa tus propios números y mira una estimación en segundos. No guardamos nada de lo que escribes.",
    fields: [
      {
        name: "messagesPerWeek",
        label: "¿Cuántos mensajes recibes por semana?",
        unit: "count",
        placeholder: "40",
      },
      {
        name: "unansweredPct",
        label: "¿Qué porcentaje queda sin respuesta a tiempo?",
        unit: "percent",
        placeholder: "20",
        hint: "De 0 a 100.",
      },
      {
        name: "avgTicketCLP",
        label: "¿Cuánto vale en promedio un cliente nuevo?",
        unit: "clp",
        placeholder: "25000",
        hint: "Monto en pesos.",
      },
      {
        name: "closeRate",
        label: "¿De cada 10 que preguntan, cuántos terminan comprando?",
        unit: "perTen",
        placeholder: "3",
        hint: "Escribe 3 si compran 3 de cada 10.",
      },
    ],
    resultTemplate: "Hoy podrías estar perdiendo cerca de {amount} al mes.",
    disclaimer: "Es una estimación con los datos que ingresaste.",
    ctaLabel: "Quiero recuperar esos clientes",
  },

  attentionTest: {
    title: "¿Qué tan bien atiende tu negocio?",
    subtitle:
      "Ocho preguntas de sí o no. Al final ves tu puntaje y lo que hoy puedes mejorar.",
    intro: "Responde con calma: tus respuestas no se guardan ni se envían a nadie.",
    yesLabel: "Sí",
    noLabel: "No",
    resultTitle: "Tu puntaje",
    scoreTemplate: "{score}/100",
    gapsTitle: "Lo que hoy dejas pasar:",
    allClear: "No detectamos brechas: tu atención está bien cubierta.",
    noGapsBrecha: "nada puntual, quiero mantener el nivel de atención",
    disclaimer:
      "Es un diagnóstico, no una nota. Te sirve como punto de partida para mejorar.",
    ctaLabel: "Quiero que me ayudes a mejorar",
    amountSuffix: "Mi calculadora estimó cerca de {amount} al mes.",
  },

  footer: {
    tagline: "Sitios web con IA que captan, convierten y atienden por tu negocio.",
    ecosystem: {
      title: "Ecosistema Aicore",
      links: [
        { label: "iapo.cl", href: "https://iapo.cl" },
        { label: "aicorebots.com", href: "https://aicorebots.com" },
        { label: "med.aicorebots.com", href: "https://med.aicorebots.com" },
        { label: "captacion360.aicorebots.com", href: "https://captacion360.aicorebots.com" },
      ],
    },
    contact: {
      title: "Contacto",
      links: [
        { label: "hablar por WhatsApp", href: "#contacto" },
        { label: "agendar diagnóstico", href: "#contacto" },
      ],
    },
    legal: "© " + new Date().getFullYear() + " AicoreLink. Todos los derechos reservados.",
  },
};

/**
 * WhatsApp destination number (E.164 without the leading +).
 * Número de WhatsApp del negocio (Chile: +56975680702).
 */
export const WHATSAPP_PHONE =
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "+56975680702";

/**
 * Booking link for the diagnostic call.
 * TODO(leonardo): replace with the real scheduling link (Cal.com / Calendly).
 */
export const bookingUrl =
  process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://cal.com/aicorelink/diagnostico";

/**
 * Builds a wa.me deep link with a prefilled, URL-encoded message.
 */
export function whatsappUrl(message: string, phone: string = WHATSAPP_PHONE): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Formats an integer CLP amount the Chilean way: `formatCLP(19990) === "$19.990"`.
 * VAT is never included — plans quote it separately via `priceNote`.
 */
const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatCLP(amount: number): string {
  return clpFormatter.format(amount);
}

/**
 * Prefilled WhatsApp messages per entry point (§10.9). Tokens `[rubro]` and
 * `$[monto]` are filled by `presetWhatsappUrl` so every CTA opens the same
 * conversation with the right context.
 */
export const PRESET_MESSAGES: {
  hero: string;
  demo: string;
  calculadora: string;
  starter: string;
  growth: string;
  elite: string;
  test: string;
} = {
  hero: "Hola, vi AicoreLink y quiero saber cuántos clientes podría estar perdiendo mi negocio de [rubro].",
  starter: "Hola, me interesa el plan Starter de AicoreLink para mi negocio de [rubro].",
  growth: "Hola, me interesa el plan Growth de AicoreLink para mi negocio de [rubro].",
  elite:
    "Hola, me interesa el plan Elite de AicoreLink (con recepcionista de voz) para mi negocio de [rubro].",
  calculadora:
    "Hola, hice el cálculo en AicoreLink y mi negocio podría estar perdiendo $[monto] al mes. Quiero ver cómo recuperarlo.",
  demo: "Hola, probé la demo de AicoreLink y quiero una igual para mi negocio.",
  test: "Hola, hice el test de atención de AicoreLink y saqué [puntaje]/100. Quiero mejorar: [brechas].",
};

/**
 * Resolves a preset message into a wa.me link, filling `[rubro]`, `$[monto]`,
 * `[puntaje]` and `[brechas]` when provided. Unknown tokens are left untouched
 * so a missing option degrades to a still-sendable template instead of a broken
 * link. The attention test joins its gaps with "; ".
 */
export function presetWhatsappUrl(
  context: keyof typeof PRESET_MESSAGES,
  opts: {
    rubro?: string;
    amountCLP?: number;
    puntaje?: number;
    brechas?: string[];
  } = {},
): string {
  let message = PRESET_MESSAGES[context];

  if (opts.rubro) {
    message = message.replace("[rubro]", opts.rubro);
  }
  if (opts.amountCLP !== undefined) {
    // The template already carries the "$", so swap the whole `$[monto]` token.
    message = message.replace("$[monto]", formatCLP(opts.amountCLP));
  }
  if (opts.puntaje !== undefined) {
    message = message.replace("[puntaje]", String(opts.puntaje));
  }
  if (opts.brechas !== undefined) {
    message = message.replace("[brechas]", opts.brechas.join("; "));
  }

  return whatsappUrl(message);
}
