import { z } from "zod";

/**
 * Lead captured by the public landing page. Deliberately tenant-less: these are
 * pre-sale enquiries from the marketing site, not data belonging to a customer.
 */
export const leadSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Contanos tu nombre")
    .max(80, "Usá como máximo 80 caracteres"),
  negocio: z
    .string()
    .trim()
    .min(2, "¿Cómo se llama tu negocio?")
    .max(120, "Usá como máximo 120 caracteres"),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Ingresá un número válido")
    .max(25, "Usá como máximo 25 caracteres")
    .regex(/^[+()\d\s.-]+$/, "Solo números, espacios y + ( ) -"),
  rubro: z.string().trim().min(1, "Elegí tu rubro"),
  mensaje: z.string().trim().max(600, "Usá como máximo 600 caracteres").optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
