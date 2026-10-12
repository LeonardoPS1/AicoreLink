import { z } from "zod";

/**
 * Lead captured by the public landing page. Deliberately tenant-less: these are
 * pre-sale enquiries from the marketing site, not data belonging to a customer.
 */
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
});

export type LeadInput = z.infer<typeof leadSchema>;
