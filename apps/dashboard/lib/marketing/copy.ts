/**
 * Landing copy — single source of truth for all marketing text.
 * Source of truth: AicoreLink_Web_Plan_de_Ejecucion.md §10 and §23 (v2 copy).
 *
 * Keeping copy out of components lets us revise wording without touching JSX.
 * Voice rules (§10.1): close, neutral Chilean Spanish, always tuteo, never voseo.
 */

import type { LostRevenueInput } from "@/lib/tools/calculator";

export type NavItem = { label: string; href: string };
export type PainItem = {
  icon: string;
  title: string;
  description: string;
  message: string;
  time: string;
  whatHappened: string;
  withAicoreLink: string;
};
export type SolutionColumn = { icon: string; title: string; description: string };
export type Step = { title: string; description: string };
export type PlanId = "starter" | "growth" | "elite";
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
export type LegalPage = {
  pageTitle: string;
  pageDescription: string;
  content: string;
};
export type LegalLinks = { label: string; href: string }[];

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
    askLabel: string;
    micro: string;
    chatExampleLabel: string;
    chips: { id: string; label: string }[];
    thread: { label: string }[];
    primaryCta: string;
    secondaryCta: string;
    trustLine: string;
  };
  trustBar: { statement: string; items: string[] };
  pains: {
    title: string;
    chapter: string;
    inboxLabel: string;
    inboxTime: string;
    items: {
      icon: string;
      title: string;
      description: string;
      message: string;
      time: string;
      whatHappened: string;
      withAicoreLink: string;
    }[];
    closing: string;
  };
  solution: { title: string; subtitle: string; columns: SolutionColumn[] };
  howItWorks: { title: string; subtitle: string; steps: Step[] };
  verticals: { title: string; subtitle: string; ctaTemplate: string };
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
    steps: { label: string }[];
    formTitle: string;
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
  ticker: {
    items: string[];
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
  demoChat: {
    /** Page metadata (mirrors the other tool pages, keeping copy in one place). */
    pageTitle: string;
    pageDescription: string;
    title: string;
    subtitle: string;
    /** Heading of the rubro chip row. */
    rubroLabel: string;
    /** Label of the visible "this is an AI / this is a demo" notice. */
    notice: string;
    inputLabel: string;
    inputPlaceholder: string;
    sendLabel: string;
    thinkingLabel: string;
    suggestionsLabel: string;
    /** Shown when the API rate-limits the visitor (HTTP 429). */
    rateLimited: string;
    genericError: string;
    retryLabel: string;
    ctaLabel: string;
  };
  voiceDemo: {
    /** Page metadata. */
    pageTitle: string;
    pageDescription: string;
    title: string;
    subtitle: string;
    /** Fixed Spanish script for the TTS demo (20–40 s). */
    script: string;
    /** Optional English script variant. */
    scriptEn: string;
    /** Label on the primary action button. */
    listenLabel: string;
    /** Loading state label on the button. */
    loadingLabel: string;
    /** Heading above the transcription. */
    transcriptLabel: string;
    /** AI notice text (R31). */
    noticeAi: string;
    /** Recording notice text (R31). */
    noticeRecording: string;
    /** CTA label for WhatsApp after the demo. */
    ctaLabel: string;
    /** Generic error when TTS/STT fails. */
    genericError: string;
  };
  footer: {
    tagline: string;
    ecosystem: FooterGroup;
    contact: FooterGroup;
    navTitle: string;
    navLinks: { label: string; href: string }[];
    legal: string;
    legalLinks: LegalLinks;
  };
  legal: {
    privacidad: LegalPage;
    terminos: LegalPage;
    cookies: LegalPage;
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
    eyebrow: "Sitios web con IA para negocios que viven de atender clientes",
    headline: "Tu negocio atendiendo, aunque estés ocupado.",
    subhead:
      "Creamos tu sitio web con IA que responde por WhatsApp, agenda citas y pide reseñas. Listo en días, sin que tengas que saber de tecnología.",
    askLabel: "Mira cómo atendería tu negocio:",
    micro: "Respondemos hoy. Sin compromiso y sin letra chica.",
    chatExampleLabel: "Negocio de ejemplo",
    chips: [
      { id: "barberia", label: "Barbería" },
      { id: "taller", label: "Taller mecánico" },
      { id: "abogados", label: "Abogados" },
      { id: "inmobiliaria", label: "Inmobiliaria" },
      { id: "clinica", label: "Clínica pequeña" },
    ],
    thread: [
      { label: "Escribe" },
      { label: "Responde" },
      { label: "Agenda" },
      { label: "Pide reseña" },
    ],
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
    chapter: "Capítulo 1",
    inboxLabel: "Bandeja de ejemplo",
    inboxTime: "Martes 22:14",
    items: [
      {
        icon: "C",
        title: "Responde a tiempo o pierdes la cita.",
        description: "Una respuesta lenta envía a tu cliente a tu competencia.",
        message: "Hola, ¿tienen hora para mañana?",
        time: "22:14. Sin respuesta hace 3 horas",
        whatHappened: "Le escribió a tu competencia y agendó allá. Tú te enteraste al día siguiente.",
        withAicoreLink: "Tu sitio responde en segundos y deja la hora agendada.",
      },
      {
        icon: "M",
        title: "Tus clientes preguntan fuera de horario.",
        description: "La atención no termina cuando tú te vas.",
        message: "¿Atienden el sábado en la tarde?",
        time: "Domingo 23:40. Leído el lunes",
        whatHappened: "Cuando por fin lo viste, ya había elegido otro lugar.",
        withAicoreLink: "Atiende y agenda de noche, fines de semana y feriados.",
      },
      {
        icon: "P",
        title: "Preguntas que repites una y otra vez.",
        description: "Tu tiempo vale más que responder lo mismo.",
        message: "¿Cuánto sale? ¿Dónde están? ¿Hasta qué hora abren?",
        time: "La misma pregunta, otra vez esta semana",
        whatHappened: "Cada respuesta repetida te saca de lo que realmente sabes hacer.",
        withAicoreLink: "Responde horarios, valores y ubicación por ti, con tu información.",
      },
      {
        icon: "G",
        title: "Buscan en Google, no en tu Instagram.",
        description: "Si no hay acción, hay abandono.",
        message: "Búsqueda en Google: “barbería cerca de mí”",
        time: "Resultado: solo tu Instagram, sin horarios ni teléfono",
        whatHappened: "Quien busca en Google quiere reservar, no recorrer un perfil.",
        withAicoreLink: "Un sitio hecho para que te contacten, con WhatsApp y horarios a la vista.",
      },
      {
        icon: "H",
        title: "Cada no-show es dinero perdido.",
        description: "Un hueco vacío no vuelve.",
        message: "Hora de las 16:00",
        time: "No llegó y no avisó",
        whatHappened: "Un hueco de una hora que no se recupera.",
        withAicoreLink: "Recordatorios automáticos con confirmación o reprogramación.",
      },
      {
        icon: "R",
        title: "Tu buena atención no se nota en Google.",
        description: "Las reseñas generan confianza.",
        message: "Quedé feliz con la atención",
        time: "Lo dijo en persona, no en Google",
        whatHappened: "Atiendes bien, pero tu ficha de Google no lo refleja.",
        withAicoreLink: "Pedimos la reseña por WhatsApp en el momento justo.",
      },
      {
        icon: "L",
        title: "No puedes atender el teléfono todo el tiempo.",
        description: "La voz es otro canal que necesitas cubrir.",
        message: "Llamada perdida",
        time: "14:32. Estabas con las manos ocupadas",
        whatHappened: "Quien llama suele querer resolver ahora. Si nadie contesta, llama al siguiente.",
        withAicoreLink: "La recepcionista de voz contesta, toma el mensaje y te avisa.",
      },
      {
        icon: "W",
        title: "Todo está disperso.",
        description: "Una cita puede perderse entre 4 lugares.",
        message: "WhatsApp, Instagram, agenda de papel y una planilla",
        time: "Cuatro lugares para una sola cita",
        whatHappened: "Algo se pierde entre medio, y no sabes qué.",
        withAicoreLink: "Todo en un solo lugar, con un reporte cada mes.",
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
    ctaTemplate: "Quiero esto para mi {singular}",
  },

  pricing: {
    title: "Planes claros. Sin costos escondidos.",
    subtitle: "Todo incluido: diseño, hosting, WhatsApp y el asistente según tu plan.",
    // Monthly prices are CLP with VAT excluded; implementation amounts follow §23.
    plans: [
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
        question: "¿Entiende las notas de voz?",
        answer:
          "Sí, nuestro asistente transcribe y procesa mensajes de voz para responder adecuadamente. Sin embargo, definimos los temas que no toca para evitar interpretaciones.",
      },
      {
        question: "¿Reemplaza mi caja, comisiones o boletas?",
        answer:
          "No. Tu sitio web con IA solo agenda citas, gestiona reservas y solicita reseñas. La emisión de facturas y el manejo de caja sigue siendo tu responsabilidad.",
      },
      {
        question: "¿Puedo probarlo antes de pagar?",
        answer:
          "Sí. Ofrecemos una garantía de 30 días: si no recibes consultas por tu sitio, no cobramos el segundo mes. Puedes cancelar en cualquier momento.",
      },
      {
        question: "¿Y si no recibo consultas?",
        answer:
          "Garantía de 30 días: si no recibes consultas por tu sitio, no cobramos el segundo mes. Esta garantía aplica a planes de pago, una vez por cliente.",
      },
      {
        question: "¿Ofrecen garantía satisfecho o reembolsado?",
        answer:
          "No reembolsos por cambio de opinión, pero tienes 30 días de garantía: si no recibes consultas por tu sitio en los primeros 30 días, no cobramos el segundo mes. El contenido y dominio siempre son tuyos.",
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
    steps: [
      { label: "Nos cuentas de tu negocio" },
      { label: "Te mostramos el diagnóstico" },
      { label: "Sales atendiendo" },
    ],
    formTitle: "Quiero mi diagnóstico gratis",
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

  ticker: {
    items: [
      "Barberías y peluquerías",
      "Talleres mecánicos",
      "Estudios jurídicos",
      "Corredoras de propiedades",
      "Clínicas y centros de salud",
      "Dentistas",
      "Kinesiólogos",
      "Psicólogos",
      "Centros de estética",
      "Contadores y asesores",
    ],
  },

  demoChat: {
    pageTitle: "Prueba la IA en vivo | AicoreLink",
    pageDescription:
      "Elige un rubro, escribe un mensaje real y mira cómo responde la IA de AicoreLink. Es una demo de un negocio de ejemplo, sin registro y sin compromiso.",
    title: "Mira cómo respondería tu negocio",
    subtitle:
      "Elige un rubro, escribe un mensaje real y mira la respuesta de la IA. Es una demo: aquí no hay un negocio de verdad detrás.",
    rubroLabel: "Elige un rubro",
    notice:
      "Es una demo con IA sobre un negocio de ejemplo. No es un negocio real y la IA responde solo con la información de este demo.",
    inputLabel: "Escribe tu mensaje",
    inputPlaceholder: "Escribe tu mensaje…",
    sendLabel: "Enviar",
    thinkingLabel: "Escribiendo…",
    suggestionsLabel: "Puedes probar con:",
    rateLimited: "Estás enviando muy rápido. Prueba en unos segundos.",
    genericError: "No pudimos responder ahora. Inténtalo de nuevo.",
    retryLabel: "Reintentar",
    ctaLabel: "Quiero una demo para mi negocio",
  },
  voiceDemo: {
    pageTitle: "Demo de voz con IA | AicoreLink",
    pageDescription:
      "Escucha cómo suena la recepcionista de voz de AicoreLink. Generamos audio con ElevenLabs y lo transcribimos con Whisper. Es una demo, sin registro y sin compromiso.",
    title: "Escucha la recepcionista de voz en acción",
    subtitle:
      "Presiona el botón y escucha cómo la IA atiende una llamada. El audio se genera con ElevenLabs y la transcripción es de Whisper. Es una demo: no se guarda tu voz.",
    script:
      "Hola, gracias por llamar a AicoreLink. Soy tu recepcionista de voz con inteligencia artificial. Puedo agendar citas, responder preguntas frecuentes y tomar mensajes para tu equipo. ¿En qué te ayudo hoy?",
    scriptEn:
      "Hello, thanks for calling AicoreLink. I'm your AI voice receptionist. I can book appointments, answer FAQs, and take messages for your team. How can I help you today?",
    listenLabel: "Escuchar demo de voz",
    loadingLabel: "Generando audio…",
    transcriptLabel: "Transcripción:",
    noticeAi: "Estás interactuando con una inteligencia artificial. Esta es una demostración.",
    noticeRecording:
      "Esta demostración genera audio y transcripción con fines de evaluación. No se almacena tu voz.",
    ctaLabel: "Quiero recepcionista de voz para mi negocio",
    genericError: "No pudimos generar la demo de voz. Inténtalo de nuevo.",
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
    legalLinks: [
      { label: "Política de privacidad", href: "/legal/privacidad" },
      { label: "Términos y condiciones", href: "/legal/terminos" },
      { label: "Política de cookies", href: "/legal/cookies" },
    ],
    navTitle: "AicoreLink",
    navLinks: [
      { label: "#dolores", href: "#problema" },
      { label: "#calculadora", href: "#herramientas/calculadora" },
      { label: "#planes", href: "#planes" },
      { label: "#preguntas", href: "#preguntas" },
    ],
  },
  legal: {
    privacidad: {
      pageTitle: "Política de privacidad | AicoreLink",
      pageDescription:
        "Cómo recopilamos, usamos y protegemos tus datos personales. Derechos ARCO y contacto del responsable.",
      content: `
## Responsable del tratamiento

AicoreLink (en adelante, "nosotros", "nuestro" o "la empresa"), con domicilio en Chile, es el responsable del tratamiento de tus datos personales. Puedes contactarnos en privacidad@aicorebots.com.

## Qué datos recopilamos

Recopilamos la información que nos proporcionas directamente cuando:
- Rellenas el formulario de contacto o solicitas un diagnóstico (nombre, email, teléfono, rubro, mensaje).
- Navegas por nuestro sitio (dirección IP, tipo de navegador, páginas visitadas, tiempo de permanencia) mediante cookies técnicas y analíticas (ver nuestra Política de cookies).
- Interactúas con el asistente de WhatsApp o la demo de chat (el contenido de tus mensajes se procesa para responderte y no se almacena más tiempo del necesario).

## Finalidad del tratamiento

Tratamos tus datos para:
1. **Responder a tus consultas** y enviarte la información que solicitas.
2. **Prestar el servicio** de creación y mantenimiento de tu sitio web con IA, incluyendo la conexión con WhatsApp, agenda y reseñas.
3. **Enviar comunicaciones comerciales** sobre nuestros planes, novedades y ofertas, siempre que hayas dado tu consentimiento o exista interés legítimo.
4. **Cumplir obligaciones legales** (facturación, contabilidad, prevención de fraude).
5. **Mejorar nuestro sitio y servicios** mediante análisis agregados y anonimizados.

## Base legal

- **Ejecución de contrato / medidas precontractuales**: para prestar el servicio y responder consultas.
- **Consentimiento**: para envío de comunicaciones comerciales y cookies no necesarias.
- **Interés legítimo**: para analítica de uso, seguridad y prevención de fraude.
- **Obligación legal**: para facturación y requerimientos de autoridades.

## Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)

Tienes derecho a:
- **Acceder** a tus datos personales y obtener copia de los mismos.
- **Rectificar** datos inexactos o incompletos.
- **Cancelar / suprimir** tus datos cuando ya no sean necesarios para los fines recogidos.
- **Oponerte** al tratamiento basado en interés legítimo o a recibir comunicaciones comerciales.
- **Limitar** el tratamiento en determinados supuestos.
- **Portabilidad** de tus datos a otro responsable (cuando el tratamiento sea automatizado y basado en consentimiento o contrato).

Para ejercer tus derechos, escribe a **privacidad@aicorebots.com** indicando el derecho que quieres ejercer y adjuntando copia de tu documento de identidad. Responderemos en el plazo legal (máximo 30 días, prorrogables a 60 en casos complejos).

## Conservación

- Datos de contacto y comerciales: mientras dure la relación contractual y, tras su fin, durante los plazos de prescripción legal (máx. 5 años en materia civil/mercantil).
- Datos de navegación (cookies): según lo indicado en la Política de cookies.
- Mensajes de WhatsApp / chat: se procesan en tiempo real y no se almacenan en nuestros servidores más allá de lo estrictamente necesario para la respuesta.

## Destinatarios y transferencias

No vendemos tus datos. Solo los compartimos con:
- Proveedores técnicos que nos ayudan a prestar el servicio (hosting, WhatsApp Business API, IA, analítica), bajo contratos de encargado de tratamiento.
- Autoridades competentes cuando exista obligación legal.

No realizamos transferencias internacionales de datos fuera de jurisdicciones con nivel de protección adecuado sin garantías apropiadas (cláusulas tipo, decisiones de adecuación).

## Seguridad

Aplicamos medidas técnicas y organizativas apropiadas (cifrado en tránsito y en reposo, acceso por roles, registro de accesos, pruebas de seguridad periódicas) para proteger tus datos contra acceso no autorizado, pérdida, alteración o divulgación.

## Menores de edad

Nuestros servicios no van dirigidos a menores de 18 años. No recopilamos conscientemente datos de menores. Si detectamos que un menor nos ha proporcionado datos, los eliminaremos a la mayor brevedad.

## Cambios en esta política

Podemos actualizar esta política para reflejar cambios legales o en nuestros servicios. La versión vigente siempre estará en esta URL con la fecha de última actualización. Te notificaremos los cambios significativos por email o mediante aviso en el sitio.

**Última actualización:** ${new Date().toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}.

## Contacto

Para cualquier duda sobre esta política o el tratamiento de tus datos:
- Email: **privacidad@aicorebots.com**
- Asunto: "Derechos ARCO / Privacidad"
      `.trim(),
    },
    terminos: {
      pageTitle: "Términos y condiciones | AicoreLink",
      pageDescription:
        "Condiciones del servicio de creación y mantenimiento de sitios web con IA. Obligaciones, cancelación, propiedad intelectual y jurisdicción chilena.",
      content: `
## 1. Objeto y aceptación

Estos Términos y Condiciones (en adelante, "Términos") regulan la contratación y uso del servicio **AicoreLink** — creación, hosting y mantenimiento de sitios web con inteligencia artificial para negocios de servicios, incluyendo asistencia por WhatsApp, agenda de citas, reseñas automáticas y, según el plan, recepcionista de voz.

Al contratar cualquiera de nuestros planes, aceptas íntegramente estos Términos. Si no estás de acuerdo, no contrates el servicio.

## 2. Descripción del servicio

AicoreLink entrega:
- **Diseño y publicación** de un sitio web adaptado a tu rubro (número de páginas según plan).
- **Hosting** en nuestra infraestructura (dominio incluido o trae el tuyo).
- **Asistente con IA** que responde por WhatsApp, toma datos y agenda citas (alcance según plan).
- **Solicitud automática de reseñas** Google tras cada cita/servicio (planes Growth y Elite).
- **Recepcionista de voz con IA** (plan Elite).
- **Reporte mensual** de consultas, citas y reseñas.
- **Soporte técnico** por canal definido en cada plan.

El servicio **no incluye**: desarrollo a medida fuera del alcance del plan, gestión de campañas publicitarias, SEO avanzado continuado, ni garantía de volumen de clientes.

## 3. Planes, precios y facturación

- Precios en **pesos chilenos (CLP)**, **IVA excluido** (se factura aparte).
- Planes: **Starter** ($19.990), **Growth** ($49.990), **Elite** ($99.990) mensuales.
- Facturación **mensual anticipada**. El primer pago se cobra al contratar.
- La **implementación inicial** puede tener costo aparte (ver detalle de cada plan) o ser gratuita sujeta a **permanencia de 6 meses**.
- Renovación automática salvo aviso de cancelación con 30 días de antelación.

## 4. Obligaciones del cliente

- Proporcionar información veraz, completa y actualizada (servicios, precios, horarios, ubicación, logo, textos).
- Responder en tiempo razonable a nuestras solicitudes de validación o contenido.
- Usar el servicio de buena fe, sin actividades ilícitas, spam, suplantación, ingeniería inversa ni sobrecarga intencional.
- Mantener las credenciales de acceso (WhatsApp, panel) seguras y notificar cualquier uso no autorizado.
- Cumplir la normativa aplicable a tu actividad (consumo, salud, datos, publicidad).

## 5. Obligaciones de AicoreLink

- Entregar el sitio funcional en **48–72 horas** tras recibir tu información completa.
- Mantener la infraestructura operativa (SLA 99.5% uptime mensual, excluyendo mantenimiento programado).
- Resguardar la confidencialidad de tus datos y los de tus clientes (ver Política de privacidad).
- Notificar con antelación razonable cualquier cambio sustancial en el servicio o precios.

## 6. Propiedad intelectual

- **Tu contenido** (textos, imágenes, marca, datos de clientes) es y sigue siendo **tuyo**. Nos concedes licencia no exclusiva, mundial y gratuita para usarlo exclusivamente para prestarte el servicio.
- **Nuestra tecnología** (código, IA, diseños base, componentes, marca AicoreLink) es de nuestra propiedad o licenciada. No adquieres derechos sobre ella más allá de la licencia de uso del servicio.
- El sitio entregado usa nuestros componentes y plantillas propietarias. Si cancelas, te entregamos tu contenido y dominio; la estructura técnica y el diseño base no son transferibles como código fuente.

## 7. Cancelación y devoluciones

- Puedes **cancelar en cualquier momento** desde tu panel o avisándonos por email con 30 días de antelación.
- Si la implementación fue **gratuita con permanencia de 6 meses**, la cancelación anticipada implica abonar el costo de implementación correspondiente a tu plan (Starter: $49.990; Growth: $49.990; Elite: $149.990).
- **Sin permanencia**: cancelas y el servicio sigue activo hasta el final del período ya pagado. No hay reembolsos por meses parciales.
- **Garantía 30 días**: si en los primeros 30 días no recibes ninguna consulta por tu sitio, no cobramos el segundo mes (aplica a planes de pago, una vez por cliente).

## 8. Limitación de responsabilidad

- El asistente de IA **puede cometer errores**. Solo responde con la información que tú aprobaste. Tú eres responsable de revisar y validar las respuestas críticas (precios, horarios, disponibilidad).
- No garantizamos volumen de clientes, citas ni reseñas. El servicio es una herramienta; el resultado depende de tu mercado, oferta y atención.
- Responsabilidad máxima agregada: **el importe pagado en los últimos 12 meses**. No respondemos por daño emergente, lucro cesante ni pérdida de datos ajena a nuestra negligencia grave.

## 9. Suspensión y terminación por nuestra parte

Podemos suspender o terminar el servicio si:
- Incumples gravemente estos Términos (impago, uso ilícito, abuso de recursos).
- Recibimos orden judicial o administrativa que lo exija.
- El servicio deja de ser viable técnicamente (te avisaremos con 60 días y te facilitaremos la migración).

## 10. Jurisdicción y ley aplicable

Estos Términos se rigen por la **ley de la República de Chile**. Cualquier controversia se someterá a los **tribunales de justicia de Santiago, Chile**, renunciando a cualquier otro fuero.

## 11. Cambios en los Términos

Podemos modificar estos Términos notificándote con **30 días de antelación** (email y aviso en el panel). Si no estás de acuerdo, puedes cancelar antes de que entren en vigor. El uso continuado implica aceptación.

## 12. Contacto

Para dudas sobre estos Términos:
- Email: **legal@aicorebots.com**
- Asunto: "Términos y condiciones"

**Versión vigente:** ${new Date().toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}.
      `.trim(),
    },
    cookies: {
      pageTitle: "Política de cookies | AicoreLink",
      pageDescription:
        "Qué cookies usamos, para qué sirven (necesarias, analíticas, marketing) y cómo puedes gestionarlas o revocar tu consentimiento.",
      content: `
## Qué son las cookies

Las cookies son pequeños archivos de texto que los sitios web guardan en tu navegador para recordar información sobre tu visita: preferencias, sesión, estadísticas de uso, etc. Algunas son imprescindibles para que el sitio funcione; otras nos ayudan a entender cómo lo usas o a mostrarte contenido relevante.

## Tipos de cookies que utilizamos

### 1. Cookies necesarias (siempre activas)
Permiten la navegación básica y el acceso a áreas seguras. Sin ellas, el sitio no funciona correctamente.
- **Sesión / autenticación**: mantienen tu sesión si accedes al panel de cliente.
- **Seguridad**: protegen contra CSRF y abuso de formularios.
- **Consentimiento**: recuerdan tu elección sobre cookies (la cookie \`aicorelink-cookie-consent\`).

**No requieren consentimiento** y no se pueden desactivar desde este aviso.

### 2. Cookies analíticas (opcionales)
Nos ayudan a entender cómo interactúas con el sitio (páginas vistas, tiempo, origen del tráfico) para mejorarlo. Usamos herramientas propias y/o de terceros (p. ej. Plausible, GA4) con IP anonimizada.
- Solo se activan **tras tu consentimiento explícito**.
- Puedes rechazarlas sin que el sitio deje de funcionar.

### 3. Cookies de marketing / personalización (opcionales)
Permiten mostrarte contenido u ofertas relevantes según tu navegación y medir la eficacia de campañas.
- Solo se activan **tras tu consentimiento explícito**.
- Incluyen píxeles de redes sociales (Meta, LinkedIn) si los habilitamos en el futuro.

## Cómo gestionar tus preferencias

- **Banner de cookies**: al entrar por primera vez, verás un banner en la parte inferior con botones "Aceptar todo" y "Rechazar no necesarias". Tu elección queda guardada en \`localStorage\` (clave \`aicorelink-cookie-consent\`) durante 12 meses.
- **Cambiar de opinión**: borra la clave \`aicorelink-cookie-consent\` en las herramientas de desarrollador de tu navegador (F12 → Application → Local Storage) o usa la opción "Borrar datos de navegación" de tu navegador para este sitio. Al recargar, volverá a aparecer el banner.
- **Controles del navegador**: todos los navegadores permiten bloquear o eliminar cookies desde su configuración. Ten en cuenta que bloquear las necesarias romperá funcionalidades del sitio.

## Terceros y transferencias

Las cookies analíticas y de marketing pueden implicar transferencia de datos a proveedores fuera de Chile (EE. UU., UE). Cuando eso ocurra, exigimos garantías adecuadas (cláusulas contractuales tipo, decisiones de adecuación) y anonimizamos la IP siempre que la herramienta lo permita.

## Cookies concretas (lista orientativa)

| Nombre | Tipo | Finalidad | Duración | Proveedor |
|--------|------|-----------|----------|-----------|
| \`aicorelink-cookie-consent\` | Necesaria | Guarda tu preferencia de consentimiento | 12 meses | Propia |
| \`next-auth.session-token\` | Necesaria | Sesión del panel de cliente | Sesión / 30 días | Propia (NextAuth) |
| \`_ga / _ga_*\` | Analítica | Google Analytics (si se habilita) | 13 meses | Google |
| \`plausible_session\` | Analítica | Plausible Analytics (si se habilita) | Sesión | Plausible |

> La lista exacta puede variar según la configuración activa. La versión completa y actualizada está disponible a petición en privacidad@aicorebots.com.

## Tus derechos

Como usuario, tienes derecho a:
- Saber qué cookies se usan y para qué.
- Retirar tu consentimiento en cualquier momento (las necesarias siguen activas).
- Solicitar la eliminación de tus datos de analítica/marketing (ver Política de privacidad, derechos ARCO).

## Cambios en esta política

Actualizaremos esta política cuando cambiemos las cookies que usemos o la normativa lo exija. La fecha de última actualización figura al final.

**Última actualización:** ${new Date().toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })}.

## Contacto

Para dudas sobre cookies:
- Email: **privacidad@aicorebots.com**
- Asunto: "Política de cookies"
      `.trim(),
    },
  },
};

/**
 * WhatsApp destination number (E.164 format, e.g. +569XXXXXXXXX).
 *
 * Reads from NEXT_PUBLIC_WHATSAPP_PHONE env var.
 * The placeholder "+56975680702" is a DEVELOPMENT FALLBACK ONLY.
 * In production (Dokploy), configure NEXT_PUBLIC_WHATSAPP_PHONE per service
 * with the REAL business number (same number across all ecosystem sites).
 * NEVER commit a real number to source control.
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
  demo: "Hola, probé la demo de AicoreLink (rubro: [rubro]) y quiero una igual para mi negocio.",
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
