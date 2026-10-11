/**
 * Landing copy — single source of truth for all marketing text.
 * Plan: docs/superpowers/plans/2026-10-11-aicorelink-landing-plan.md (§6)
 *
 * Keeping copy out of components lets us revise wording without touching JSX.
 */

export type NavItem = { label: string; href: string };
export type PainItem = { icon: string; title: string; description: string };
export type SolutionColumn = { icon: string; title: string; description: string };
export type Step = { title: string; description: string };
export type PlanId = "starter" | "growth" | "elite";
export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  priceLabel: string;
  forWho: string;
  features: string[];
  ctaLabel: string;
  highlighted: boolean;
  badge?: string;
};
export type FaqItem = { question: string; answer: string };
export type FooterGroup = { title: string; links: { label: string; href: string }[] };

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
  testimonials: { title: string; subtitle: string; placeholderNotice: string };
  faq: { title: string; subtitle: string; items: FaqItem[] };
  cta: {
    title: string;
    subtitle: string;
    primaryLabel: string;
    secondaryLabel: string;
    guarantee: string;
  };
  stickyWhatsApp: { label: string; message: string };
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
      "Creamos tu página web y le conectamos un asistente con IA que responde por WhatsApp, agenda citas y nunca deja un mensaje sin contestar. Todo incluido en una cuota mensual.",
    primaryCta: "Quiero mi sitio con IA",
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
    title: "Si te identificás con esto, estás perdiendo clientes todos los días",
    items: [
      {
        icon: "💬",
        title: "No llegás a contestar",
        description:
          "Estás con un cliente, manejando o ya cerraste. El mensaje llega igual. Y el cliente no espera: le escribe al siguiente de la lista.",
      },
      {
        icon: "🌐",
        title: "Tu web existe, pero no vende",
        description:
          "Una página que solo muestra información es un folleto caro. Sin formulario, sin chat y sin agenda, el visitante se va sin dejar rastro.",
      },
      {
        icon: "📅",
        title: "Agendás a mano",
        description:
          "Turnos por WhatsApp, llamadas perdidas y citas que se superponen. Tu agenda te consume más tiempo del que te ahorra.",
      },
      {
        icon: "⭐",
        title: "No tenés reseñas y Google te ignora",
        description:
          "Los negocios con más reseñas consiguen hasta 3 veces más contactos. Pedirlas una por una, nunca alcanza.",
      },
      {
        icon: "💸",
        title: "Pagar una web es caro y mantenerla, peor",
        description:
          "Precios altísimos por un sitio que después nadie actualiza. Y cada cambio se cobra aparte.",
      },
    ],
    closing:
      "Todos estos problemas tienen la misma causa: falta de atención automática. Y la misma solución.",
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
          "La IA agenda citas, envía recordatorios, pide reseñas automáticamente y te avisa cuando hace falta que intervengas vos.",
      },
    ],
  },

  howItWorks: {
    title: "Empezás a recibir clientes en pocos días",
    subtitle: "Sin formularios eternos ni reuniones interminables.",
    steps: [
      {
        title: "Nos contás tu negocio.",
        description:
          "Una llamada de 15 minutos. Nos contás qué hacés, a quién atendés y qué querés lograr.",
      },
      {
        title: "Te armamos el sitio.",
        description:
          "Diseñamos tu página web con IA, lista para convertir. Vos aprobás el contenido.",
      },
      {
        title: "Conectamos WhatsApp e IA.",
        description: "Enlazamos tu WhatsApp y entrenamos al asistente con tu información.",
      },
      {
        title: "Recibís clientes.",
        description:
          "Tu web capta, tu IA atiende y vos te enfocás en trabajar. Nosotros nos ocupamos del resto.",
      },
    ],
  },

  verticals: {
    title: "Hecho para negocios como el tuyo",
    subtitle: "Si vendés servicios, tiempo o consultas (no un catálogo de productos), esto es para vos.",
    note: "No es para tiendas con catálogo. Es para negocios que necesitan captar, convertir y atender.",
    ctaTemplate: "Quiero esto para mi {singular}",
  },

  pricing: {
    title: "Planes claros. Sin costos escondidos.",
    subtitle: "Todo incluido: diseño, hosting, WhatsApp Business, IA y soporte.",
    plans: [
      {
        id: "starter",
        name: "Starter",
        price: "$49",
        priceLabel: "desde $49 / mes",
        forWho: "Negocio que arranca",
        features: [
          "3 páginas",
          "Formulario de contacto",
          "Chat con IA básico",
          "Hosting y SSL incluidos",
        ],
        ctaLabel: "Agendar diagnóstico gratis",
        highlighted: false,
      },
      {
        id: "growth",
        name: "Growth",
        price: "$99",
        priceLabel: "desde $99 / mes",
        forWho: "Negocio que quiere crecer",
        features: [
          "5 páginas",
          "Calendario de citas",
          "Reseñas automáticas",
          "Chat con IA avanzado",
        ],
        ctaLabel: "Agendar diagnóstico gratis",
        highlighted: true,
        badge: "Más elegido",
      },
      {
        id: "elite",
        name: "Elite",
        price: "$199",
        priceLabel: "desde $199 / mes",
        forWho: "Negocio que quiere automatizar todo",
        features: [
          "Hasta 10 páginas",
          "Chat con IA avanzado",
          "Recepcionista de voz con IA",
          "Todo lo de Growth, incluido",
        ],
        ctaLabel: "Agendar diagnóstico gratis",
        highlighted: false,
      },
    ],
    note: "La inversión inicial puede ser $0. Vos elegís: pagás solo la cuota mensual o un setup mínimo para arrancar antes.",
  },

  testimonials: {
    title: "Negocios que ya no pierden clientes",
    subtitle: "Resultados de negocios de servicios que automatizaron su atención.",
    placeholderNotice:
      "Sección en preparación: los casos se publican solo con autorización del cliente y datos verificados.",
  },

  faq: {
    title: "Preguntas frecuentes",
    subtitle: "Lo que todo negocio pregunta antes de empezar.",
    items: [
      {
        question: "¿Qué incluye la cuota mensual?",
        answer:
          "Diseño, hosting, SSL, WhatsApp Business, asistente con IA, mantenimiento, actualizaciones y soporte. Una sola cuota.",
      },
      {
        question: "¿Necesito saber de tecnología?",
        answer: "No. Nosotros armamos y configuramos todo. Vos solo aprobás el contenido.",
      },
      {
        question: "¿Puedo usar mi propio dominio?",
        answer: "Sí. Si ya tenés dominio, lo conectamos. Si no, te ayudamos a conseguirlo.",
      },
      {
        question: "¿La IA responde cualquier cosa?",
        answer:
          "No. La entrenamos con tu información real y, cuando no sabe, te pasa la conversación a vos. No inventa.",
      },
      {
        question: "¿Y si ya tengo una web?",
        answer:
          "La renovamos o te armamos una nueva que sí convierta. Sin perder lo que ya posicionaste.",
      },
      {
        question: "¿Hay contrato mínimo?",
        answer: "Trabajamos mes a mes. Si en 30 días no ves resultados, no seguimos.",
      },
      {
        question: "¿Sirve para mi rubro?",
        answer:
          "Si tu negocio necesita captar, convertir o atender clientes, sí. Si vendés un catálogo de productos, no es para vos.",
      },
    ],
  },

  cta: {
    title: "¿Listo para dejar de perder clientes?",
    subtitle:
      "Agendá una llamada de 15 minutos. Te mostramos cómo se vería tu negocio con un sitio que atiende solo.",
    primaryLabel: "Agendar diagnóstico gratis",
    secondaryLabel: "Escribir por WhatsApp",
    guarantee: "Sin compromiso. Si no es para vos, te lo decimos.",
  },

  stickyWhatsApp: {
    label: "¿Hablamos? 💬",
    message: "Hola, quiero un sitio web con IA para mi negocio.",
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
 * TODO(leonardo): replace the placeholder with the real business number.
 */
export const WHATSAPP_PHONE =
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "5491100000000";

/**
 * Booking link for the 15-minute diagnostic call.
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
