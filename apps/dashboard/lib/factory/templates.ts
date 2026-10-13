/**
 * Site Templates for Fábrica de sitios.
 *
 * Defines 9 templates: 3 rubros × 3 plan tiers (starter/growth/elite).
 * Templates are shared by rubro (no tenantId) and contain portable block structures
 * with {{variable}} placeholders for generator grounding.
 */

import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Template block types — portable content blocks (not HTML).
 */
export const BlockTypeEnum = z.enum([
  "hero",
  "services",
  "team",
  "contact",
  "booking",
  "gallery",
  "blog",
  "faq",
  "reviews",
  "promos",
  "cases",
  "resources",
  "cta",
]);

export type BlockType = z.infer<typeof BlockTypeEnum>;

/**
 * A single template block with placeholders.
 */
export const TemplateBlockSchema = z.object({
  type: BlockTypeEnum,
  content: z.record(z.union([z.string(), z.array(z.string())])),
  requiredVariables: z.array(z.string()),
});

export type TemplateBlock = z.infer<typeof TemplateBlockSchema>;

/**
 * A page template within a SiteTemplate.
 */
export const TemplatePageSchema = z.object({
  path: z.string(),
  title: z.string(),
  blocksTemplate: z.array(TemplateBlockSchema),
  requiredVariables: z.array(z.string()),
  order: z.number().int().default(0),
});

export type TemplatePage = z.infer<typeof TemplatePageSchema>;

/**
 * Full template definition.
 */
export const SiteTemplateSchema = z.object({
  rubro: z.enum(["barberia", "taller", "profesional"]),
  name: z.string(),
  planTier: z.enum(["starter", "growth", "elite"]),
  pageCount: z.number().int(),
  structure: z.array(TemplatePageSchema),
});

export type SiteTemplateDefinition = z.infer<typeof SiteTemplateSchema>;

/**
 * Required variables that come from BusinessProfile for grounding.
 */
export const REQUIRED_TEMPLATE_VARIABLES = [
  "businessName",
  "tagline",
  "phone",
  "email",
  "address",
  "hours",
  "services",
  "team",
  "faqs",
  "logoUrl",
  "images",
  "social",
  "description",
] as const;

export type RequiredTemplateVariable = (typeof REQUIRED_TEMPLATE_VARIABLES)[number];

/**
 * Helper to create a block with proper structure.
 */
function block(type: BlockType, content: Record<string, string | string[]>, requiredVariables: string[]): TemplateBlock {
  return { type, content, requiredVariables };
}

/**
 * Helper to create a page with proper structure.
 */
function page(
  path: string,
  title: string,
  blocksTemplate: TemplateBlock[],
  requiredVariables: string[],
  order: number
): TemplatePage {
  return { path, title, blocksTemplate, requiredVariables, order };
}

/**
 * ============================================================
 * BARBERÍA TEMPLATES
 * ============================================================
 */

const barberiaStarterPages: TemplatePage[] = [
  page(
    "/",
    "Inicio",
    [
      block("hero", {
        headline: "Tu {{businessName}} atendiendo, aunque estés ocupado.",
        subheadline: "{{tagline}}",
        ctaPrimary: "Reservar hora",
        ctaSecondary: "Hablar por WhatsApp",
      }, ["businessName", "tagline"]),
      block("services", {
        sectionTitle: "Nuestros servicios",
        items: "{{services}}",
      }, ["services"]),
      block("cta", {
        headline: "Reserva tu hora en segundos",
        buttonText: "Agendar ahora",
        whatsappText: "Hola, quiero reservar en {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "services"],
    0
  ),
  page(
    "/servicios",
    "Servicios",
    [
      block("hero", {
        headline: "Servicios de {{businessName}}",
        subheadline: "{{tagline}}",
      }, ["businessName", "tagline"]),
      block("services", {
        sectionTitle: "Todos nuestros servicios",
        items: "{{services}}",
      }, ["services"]),
      block("cta", {
        headline: "¿Te interesa algún servicio?",
        buttonText: "Reservar ahora",
        whatsappText: "Hola, quiero información sobre servicios en {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "services"],
    1
  ),
  page(
    "/contacto",
    "Contacto",
    [
      block("hero", {
        headline: "Contacta a {{businessName}}",
        subheadline: "{{tagline}}",
      }, ["businessName", "tagline"]),
      block("contact", {
        sectionTitle: "Estamos para ti",
        phone: "{{phone}}",
        email: "{{email}}",
        address: "{{address}}",
        hours: "{{hours}}",
        mapEmbedUrl: "",
      }, ["phone", "email", "address", "hours"]),
      block("cta", {
        headline: "Escríbenos por WhatsApp",
        buttonText: "Hablar ahora",
        whatsappText: "Hola {{businessName}}, tengo una consulta",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "phone", "email", "address", "hours"],
    2
  ),
];

const barberiaGrowthPages: TemplatePage[] = [
  ...barberiaStarterPages,
  page(
    "/equipo",
    "Equipo",
    [
      block("hero", {
        headline: "Conoce al equipo de {{businessName}}",
        subheadline: "{{tagline}}",
      }, ["businessName", "tagline"]),
      block("team", {
        sectionTitle: "Nuestros barberos",
        members: "{{team}}",
      }, ["team"]),
      block("cta", {
        headline: "Reserva con tu barbero favorito",
        buttonText: "Agendar hora",
        whatsappText: "Hola, quiero reservar con un barbero de {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "team"],
    3
  ),
  page(
    "/reservar",
    "Reservar",
    [
      block("hero", {
        headline: "Reserva tu hora en {{businessName}}",
        subheadline: "Elige servicio, barbero y horario",
      }, ["businessName"]),
      block("booking", {
        sectionTitle: "Reserva online",
        services: "{{services}}",
        team: "{{team}}",
        whatsappText: "Hola, quiero reservar en {{businessName}}",
      }, ["services", "team", "businessName"]),
      block("cta", {
        headline: "¿Prefieres hablar por WhatsApp?",
        buttonText: "Escribir por WhatsApp",
        whatsappText: "Hola, quiero reservar en {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "services", "team"],
    4
  ),
];

const barberiaElitePages: TemplatePage[] = [
  ...barberiaGrowthPages,
  page(
    "/blog",
    "Blog",
    [
      block("hero", {
        headline: "Blog de {{businessName}}",
        subheadline: "Consejos, tendencias y novedades",
      }, ["businessName"]),
      block("blog", {
        sectionTitle: "Últimos artículos",
        posts: "{{blogPosts}}",
      }, []),
      block("cta", {
        headline: "Suscríbete a nuestras novedades",
        buttonText: "Suscribirme",
        whatsappText: "Hola {{businessName}}, quiero recibir novedades",
      }, ["businessName"]),
    ],
    ["businessName"],
    5
  ),
  page(
    "/galeria",
    "Galería",
    [
      block("hero", {
        headline: "Galería de {{businessName}}",
        subheadline: "Nuestros mejores trabajos",
      }, ["businessName"]),
      block("gallery", {
        sectionTitle: "Ver galería",
        images: "{{images}}",
      }, ["images"]),
      block("cta", {
        headline: "¿Te gustó lo que ves?",
        buttonText: "Reservar hora",
        whatsappText: "Hola, vi la galería de {{businessName}} y quiero reservar",
      }, ["businessName"]),
    ],
    ["businessName", "images"],
    6
  ),
  page(
    "/promos",
    "Promociones",
    [
      block("hero", {
        headline: "Promociones en {{businessName}}",
        subheadline: "Ofertas especiales para ti",
      }, ["businessName"]),
      block("promos", {
        sectionTitle: "Promociones vigentes",
        promotions: "{{promos}}",
      }, []),
      block("cta", {
        headline: "Aprovecha esta promoción",
        buttonText: "Reservar ahora",
        whatsappText: "Hola, vi la promoción de {{businessName}} y quiero aprovecharla",
      }, ["businessName"]),
    ],
    ["businessName"],
    7
  ),
  page(
    "/faq",
    "Preguntas Frecuentes",
    [
      block("hero", {
        headline: "Preguntas frecuentes de {{businessName}}",
        subheadline: "Resolvemos tus dudas",
      }, ["businessName"]),
      block("faq", {
        sectionTitle: "Preguntas frecuentes",
        items: "{{faqs}}",
      }, ["faqs"]),
      block("cta", {
        headline: "¿No encontraste tu respuesta?",
        buttonText: "Preguntar por WhatsApp",
        whatsappText: "Hola {{businessName}}, tengo una pregunta",
      }, ["businessName"]),
    ],
    ["businessName", "faqs"],
    8
  ),
  page(
    "/resenas",
    "Reseñas",
    [
      block("hero", {
        headline: "Lo que dicen de {{businessName}}",
        subheadline: "Opiniones reales de clientes",
      }, ["businessName"]),
      block("reviews", {
        sectionTitle: "Reseñas de clientes",
        reviews: "{{reviews}}",
      }, []),
      block("cta", {
        headline: "Tu opinión nos importa",
        buttonText: "Dejar reseña",
        whatsappText: "Hola {{businessName}}, quiero dejar una reseña",
      }, ["businessName"]),
    ],
    ["businessName"],
    9
  ),
];

/**
 * ============================================================
 * TALLER TEMPLATES
 * ============================================================
 */

const tallerStarterPages: TemplatePage[] = [
  page(
    "/",
    "Inicio",
    [
      block("hero", {
        headline: "Tu {{businessName}} de confianza, siempre disponible.",
        subheadline: "{{tagline}}",
        ctaPrimary: "Agendar revisión",
        ctaSecondary: "Hablar por WhatsApp",
      }, ["businessName", "tagline"]),
      block("services", {
        sectionTitle: "Nuestros servicios",
        items: "{{services}}",
      }, ["services"]),
      block("cta", {
        headline: "Agenda tu revisión en minutos",
        buttonText: "Agendar ahora",
        whatsappText: "Hola, quiero agendar en {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "services"],
    0
  ),
  page(
    "/servicios",
    "Servicios",
    [
      block("hero", {
        headline: "Servicios de {{businessName}}",
        subheadline: "{{tagline}}",
      }, ["businessName", "tagline"]),
      block("services", {
        sectionTitle: "Todos nuestros servicios",
        items: "{{services}}",
      }, ["services"]),
      block("cta", {
        headline: "¿Necesitas algún servicio?",
        buttonText: "Agendar revisión",
        whatsappText: "Hola, quiero información sobre servicios en {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "services"],
    1
  ),
  page(
    "/contacto",
    "Contacto",
    [
      block("hero", {
        headline: "Contacta a {{businessName}}",
        subheadline: "{{tagline}}",
      }, ["businessName", "tagline"]),
      block("contact", {
        sectionTitle: "Estamos para ti",
        phone: "{{phone}}",
        email: "{{email}}",
        address: "{{address}}",
        hours: "{{hours}}",
        mapEmbedUrl: "",
      }, ["phone", "email", "address", "hours"]),
      block("cta", {
        headline: "Escríbenos por WhatsApp",
        buttonText: "Hablar ahora",
        whatsappText: "Hola {{businessName}}, tengo una consulta",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "phone", "email", "address", "hours"],
    2
  ),
];

const tallerGrowthPages: TemplatePage[] = [
  ...tallerStarterPages,
  page(
    "/equipo",
    "Equipo",
    [
      block("hero", {
        headline: "Conoce al equipo de {{businessName}}",
        subheadline: "{{tagline}}",
      }, ["businessName", "tagline"]),
      block("team", {
        sectionTitle: "Nuestros mecánicos",
        members: "{{team}}",
      }, ["team"]),
      block("cta", {
        headline: "Confía tu auto a expertos",
        buttonText: "Agendar revisión",
        whatsappText: "Hola, quiero agendar con un mecánico de {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "team"],
    3
  ),
  page(
    "/reservar",
    "Reservar",
    [
      block("hero", {
        headline: "Reserva tu hora en {{businessName}}",
        subheadline: "Elige servicio y horario",
      }, ["businessName"]),
      block("booking", {
        sectionTitle: "Reserva online",
        services: "{{services}}",
        team: "{{team}}",
        whatsappText: "Hola, quiero reservar en {{businessName}}",
      }, ["services", "team", "businessName"]),
      block("cta", {
        headline: "¿Prefieres hablar por WhatsApp?",
        buttonText: "Escribir por WhatsApp",
        whatsappText: "Hola, quiero reservar en {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "services", "team"],
    4
  ),
];

const tallerElitePages: TemplatePage[] = [
  ...tallerGrowthPages,
  page(
    "/blog",
    "Blog",
    [
      block("hero", {
        headline: "Blog de {{businessName}}",
        subheadline: "Consejos de mantenimiento y novedades",
      }, ["businessName"]),
      block("blog", {
        sectionTitle: "Últimos artículos",
        posts: "{{blogPosts}}",
      }, []),
      block("cta", {
        headline: "Suscríbete a nuestros consejos",
        buttonText: "Suscribirme",
        whatsappText: "Hola {{businessName}}, quiero recibir consejos de mantenimiento",
      }, ["businessName"]),
    ],
    ["businessName"],
    5
  ),
  page(
    "/galeria",
    "Galería",
    [
      block("hero", {
        headline: "Galería de {{businessName}}",
        subheadline: "Trabajos realizados",
      }, ["businessName"]),
      block("gallery", {
        sectionTitle: "Ver galería",
        images: "{{images}}",
      }, ["images"]),
      block("cta", {
        headline: "¿Te gustó nuestro trabajo?",
        buttonText: "Agendar revisión",
        whatsappText: "Hola, vi la galería de {{businessName}} y quiero agendar",
      }, ["businessName"]),
    ],
    ["businessName", "images"],
    6
  ),
  page(
    "/promos",
    "Promociones",
    [
      block("hero", {
        headline: "Promociones en {{businessName}}",
        subheadline: "Ofertas en servicios seleccionados",
      }, ["businessName"]),
      block("promos", {
        sectionTitle: "Promociones vigentes",
        promotions: "{{promos}}",
      }, []),
      block("cta", {
        headline: "Aprovecha esta promoción",
        buttonText: "Agendar ahora",
        whatsappText: "Hola, vi la promoción de {{businessName}} y quiero aprovecharla",
      }, ["businessName"]),
    ],
    ["businessName"],
    7
  ),
  page(
    "/faq",
    "Preguntas Frecuentes",
    [
      block("hero", {
        headline: "Preguntas frecuentes de {{businessName}}",
        subheadline: "Resolvemos tus dudas",
      }, ["businessName"]),
      block("faq", {
        sectionTitle: "Preguntas frecuentes",
        items: "{{faqs}}",
      }, ["faqs"]),
      block("cta", {
        headline: "¿No encontraste tu respuesta?",
        buttonText: "Preguntar por WhatsApp",
        whatsappText: "Hola {{businessName}}, tengo una pregunta",
      }, ["businessName"]),
    ],
    ["businessName", "faqs"],
    8
  ),
  page(
    "/resenas",
    "Reseñas",
    [
      block("hero", {
        headline: "Lo que dicen de {{businessName}}",
        subheadline: "Opiniones reales de clientes",
      }, ["businessName"]),
      block("reviews", {
        sectionTitle: "Reseñas de clientes",
        reviews: "{{reviews}}",
      }, []),
      block("cta", {
        headline: "Tu opinión nos importa",
        buttonText: "Dejar reseña",
        whatsappText: "Hola {{businessName}}, quiero dejar una reseña",
      }, ["businessName"]),
    ],
    ["businessName"],
    9
  ),
];

/**
 * ============================================================
 * PROFESIONAL TEMPLATES
 * ============================================================
 */

const profesionalStarterPages: TemplatePage[] = [
  page(
    "/",
    "Inicio",
    [
      block("hero", {
        headline: "{{businessName}} — {{tagline}}",
        subheadline: "Atención profesional, cuando la necesitas.",
        ctaPrimary: "Agendar consulta",
        ctaSecondary: "Hablar por WhatsApp",
      }, ["businessName", "tagline"]),
      block("services", {
        sectionTitle: "Nuestros servicios",
        items: "{{services}}",
      }, ["services"]),
      block("cta", {
        headline: "Agenda tu consulta hoy",
        buttonText: "Agendar ahora",
        whatsappText: "Hola, quiero agendar una consulta en {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "services"],
    0
  ),
  page(
    "/servicios",
    "Servicios",
    [
      block("hero", {
        headline: "Servicios de {{businessName}}",
        subheadline: "{{tagline}}",
      }, ["businessName", "tagline"]),
      block("services", {
        sectionTitle: "Todos nuestros servicios",
        items: "{{services}}",
      }, ["services"]),
      block("cta", {
        headline: "¿Te interesa algún servicio?",
        buttonText: "Agendar consulta",
        whatsappText: "Hola, quiero información sobre servicios en {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "services"],
    1
  ),
  page(
    "/contacto",
    "Contacto",
    [
      block("hero", {
        headline: "Contacta a {{businessName}}",
        subheadline: "{{tagline}}",
      }, ["businessName", "tagline"]),
      block("contact", {
        sectionTitle: "Estamos para ti",
        phone: "{{phone}}",
        email: "{{email}}",
        address: "{{address}}",
        hours: "{{hours}}",
        mapEmbedUrl: "",
      }, ["phone", "email", "address", "hours"]),
      block("cta", {
        headline: "Escríbenos por WhatsApp",
        buttonText: "Hablar ahora",
        whatsappText: "Hola {{businessName}}, tengo una consulta",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "phone", "email", "address", "hours"],
    2
  ),
];

const profesionalGrowthPages: TemplatePage[] = [
  ...profesionalStarterPages,
  page(
    "/equipo",
    "Equipo",
    [
      block("hero", {
        headline: "Conoce al equipo de {{businessName}}",
        subheadline: "{{tagline}}",
      }, ["businessName", "tagline"]),
      block("team", {
        sectionTitle: "Nuestros profesionales",
        members: "{{team}}",
      }, ["team"]),
      block("cta", {
        headline: "Agenda con el profesional indicado",
        buttonText: "Agendar consulta",
        whatsappText: "Hola, quiero agendar con un profesional de {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "tagline", "team"],
    3
  ),
  page(
    "/agendar",
    "Agendar",
    [
      block("hero", {
        headline: "Agenda tu consulta en {{businessName}}",
        subheadline: "Elige profesional, servicio y horario",
      }, ["businessName"]),
      block("booking", {
        sectionTitle: "Agenda online",
        services: "{{services}}",
        team: "{{team}}",
        whatsappText: "Hola, quiero agendar en {{businessName}}",
      }, ["services", "team", "businessName"]),
      block("cta", {
        headline: "¿Prefieres hablar por WhatsApp?",
        buttonText: "Escribir por WhatsApp",
        whatsappText: "Hola, quiero agendar en {{businessName}}",
      }, ["businessName"]),
    ],
    ["businessName", "services", "team"],
    4
  ),
];

const profesionalElitePages: TemplatePage[] = [
  ...profesionalGrowthPages,
  page(
    "/blog",
    "Blog",
    [
      block("hero", {
        headline: "Blog de {{businessName}}",
        subheadline: "Artículos, guías y novedades",
      }, ["businessName"]),
      block("blog", {
        sectionTitle: "Últimos artículos",
        posts: "{{blogPosts}}",
      }, []),
      block("cta", {
        headline: "Suscríbete a nuestro contenido",
        buttonText: "Suscribirme",
        whatsappText: "Hola {{businessName}}, quiero recibir contenido",
      }, ["businessName"]),
    ],
    ["businessName"],
    5
  ),
  page(
    "/casos",
    "Casos de Éxito",
    [
      block("hero", {
        headline: "Casos de éxito de {{businessName}}",
        subheadline: "Resultados que hablan por sí solos",
      }, ["businessName"]),
      block("cases", {
        sectionTitle: "Casos destacados",
        cases: "{{cases}}",
      }, []),
      block("cta", {
        headline: "¿Quieres ser nuestro próximo caso de éxito?",
        buttonText: "Agendar consulta",
        whatsappText: "Hola, vi los casos de {{businessName}} y quiero agendar",
      }, ["businessName"]),
    ],
    ["businessName"],
    6
  ),
  page(
    "/faq",
    "Preguntas Frecuentes",
    [
      block("hero", {
        headline: "Preguntas frecuentes de {{businessName}}",
        subheadline: "Resolvemos tus dudas",
      }, ["businessName"]),
      block("faq", {
        sectionTitle: "Preguntas frecuentes",
        items: "{{faqs}}",
      }, ["faqs"]),
      block("cta", {
        headline: "¿No encontraste tu respuesta?",
        buttonText: "Preguntar por WhatsApp",
        whatsappText: "Hola {{businessName}}, tengo una pregunta",
      }, ["businessName"]),
    ],
    ["businessName", "faqs"],
    7
  ),
  page(
    "/resenas",
    "Reseñas",
    [
      block("hero", {
        headline: "Lo que dicen de {{businessName}}",
        subheadline: "Opiniones reales de clientes",
      }, ["businessName"]),
      block("reviews", {
        sectionTitle: "Reseñas de clientes",
        reviews: "{{reviews}}",
      }, []),
      block("cta", {
        headline: "Tu opinión nos importa",
        buttonText: "Dejar reseña",
        whatsappText: "Hola {{businessName}}, quiero dejar una reseña",
      }, ["businessName"]),
    ],
    ["businessName"],
    8
  ),
  page(
    "/recursos",
    "Recursos",
    [
      block("hero", {
        headline: "Recursos de {{businessName}}",
        subheadline: "Guías, plantillas y documentos útiles",
      }, ["businessName"]),
      block("resources", {
        sectionTitle: "Recursos disponibles",
        resources: "{{resources}}",
      }, []),
      block("cta", {
        headline: "¿Necesitas ayuda con algo específico?",
        buttonText: "Agendar consulta",
        whatsappText: "Hola {{businessName}}, necesito ayuda con un recurso",
      }, ["businessName"]),
    ],
    ["businessName"],
    9
  ),
];

/**
 * ============================================================
 * ALL TEMPLATES REGISTRY
 * ============================================================
 */

export const TEMPLATES: SiteTemplateDefinition[] = [
  // Barbería
  {
    rubro: "barberia",
    name: "Barbería Starter",
    planTier: "starter",
    pageCount: 3,
    structure: barberiaStarterPages,
  },
  {
    rubro: "barberia",
    name: "Barbería Growth",
    planTier: "growth",
    pageCount: 5,
    structure: barberiaGrowthPages,
  },
  {
    rubro: "barberia",
    name: "Barbería Elite",
    planTier: "elite",
    pageCount: 10,
    structure: barberiaElitePages,
  },
  // Taller
  {
    rubro: "taller",
    name: "Taller Starter",
    planTier: "starter",
    pageCount: 3,
    structure: tallerStarterPages,
  },
  {
    rubro: "taller",
    name: "Taller Growth",
    planTier: "growth",
    pageCount: 5,
    structure: tallerGrowthPages,
  },
  {
    rubro: "taller",
    name: "Taller Elite",
    planTier: "elite",
    pageCount: 10,
    structure: tallerElitePages,
  },
  // Profesional
  {
    rubro: "profesional",
    name: "Profesional Starter",
    planTier: "starter",
    pageCount: 3,
    structure: profesionalStarterPages,
  },
  {
    rubro: "profesional",
    name: "Profesional Growth",
    planTier: "growth",
    pageCount: 5,
    structure: profesionalGrowthPages,
  },
  {
    rubro: "profesional",
    name: "Profesional Elite",
    planTier: "elite",
    pageCount: 10,
    structure: profesionalElitePages,
  },
];

/**
 * Get all templates for a specific rubro.
 */
export function getTemplatesByRubro(rubro: "barberia" | "taller" | "profesional"): SiteTemplateDefinition[] {
  return TEMPLATES.filter((t) => t.rubro === rubro);
}

/**
 * Get a specific template by rubro and planTier.
 */
export function getTemplate(rubro: "barberia" | "taller" | "profesional", planTier: "starter" | "growth" | "elite"): SiteTemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.rubro === rubro && t.planTier === planTier);
}

/**
 * Get template pages for a given template ID (from DB).
 */
export async function getTemplatePages(templateId: string): Promise<any[]> {
  return db.siteTemplatePage.findMany({
    where: { templateId },
    orderBy: { order: "asc" },
  });
}

/**
 * Seed all 9 templates into the database.
 * Run once during setup: npx tsx prisma/seed-templates.ts
 */
export async function seedTemplates(): Promise<void> {
  console.log("🌱 Seeding site templates...");

  for (const template of TEMPLATES) {
    // Upsert template using composite unique key (rubro + planTier)
    const existingTemplate = await db.siteTemplate.findUnique({
      where: { rubro_planTier: { rubro: template.rubro, planTier: template.planTier } },
    });

    let templateId: string;

    if (existingTemplate) {
      // Update existing
      const updated = await db.siteTemplate.update({
        where: { id: existingTemplate.id },
        data: {
          name: template.name,
          planTier: template.planTier,
          pageCount: template.pageCount,
          structure: template.structure as any,
        },
      });
      templateId = updated.id;
      console.log(`  ✓ Updated template: ${template.name} (${template.rubro} - ${template.planTier})`);
    } else {
      // Create new
      const created = await db.siteTemplate.create({
        data: {
          rubro: template.rubro,
          name: template.name,
          planTier: template.planTier,
          pageCount: template.pageCount,
          structure: template.structure as any,
        },
      });
      templateId = created.id;
      console.log(`  ✓ Created template: ${template.name} (${template.rubro} - ${template.planTier})`);
    }

    // Upsert pages for this template
    for (const tmplPage of template.structure) {
      await db.siteTemplatePage.upsert({
        where: {
          templateId_path: {
            templateId,
            path: tmplPage.path,
          },
        },
        update: {
          title: tmplPage.title,
          blocksTemplate: tmplPage.blocksTemplate as any,
          requiredVariables: tmplPage.requiredVariables,
          order: tmplPage.order,
        },
        create: {
          templateId,
          path: tmplPage.path,
          title: tmplPage.title,
          blocksTemplate: tmplPage.blocksTemplate as any,
          requiredVariables: tmplPage.requiredVariables,
          order: tmplPage.order,
        },
      });
    }

    console.log(`    → ${template.structure.length} pages synced`);
  }

  console.log("✅ All templates seeded successfully!");
}