import { z } from "zod";

/**
 * Lead captured by the public landing page. Deliberately tenant-less: these are
 * pre-sale enquiries from the marketing site, not data belonging to a customer.
 */
const utmSchema = z.object({
  source: z.string().trim().max(100).optional(),
  medium: z.string().trim().max(100).optional(),
  campaign: z.string().trim().max(100).optional(),
  content: z.string().trim().max(100).optional(),
  term: z.string().trim().max(100).optional(),
});

export const leadSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Cuéntanos tu nombre")
    .max(80, "Usa como máximo 80 caracteres"),
  negocio: z
    .string()
    .trim()
    .min(2, "¿Cómo se llama tu negocio?")
    .max(120, "Usa como máximo 120 caracteres"),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Ingresa un número válido")
    .max(25, "Usa como máximo 25 caracteres")
    .regex(/^[+()\d\s.-]+$/, "Solo números, espacios y + ( ) -"),
  rubro: z.string().trim().min(1, "Elige tu rubro"),
  mensaje: z.string().trim().max(600, "Usa como máximo 600 caracteres").optional(),
  utm: utmSchema.optional(),
  consent: z.literal(true, { message: "Debes aceptar el tratamiento de datos" }),
});

export type LeadInput = z.infer<typeof leadSchema>;
