import { z } from "zod";

/**
 * Verticals of the public live chat demo (plan §5.2). Deliberately separate from
 * the six marketing verticals in `lib/marketing/verticals.ts` (ruling R26): the
 * demo has its own four chips and that file is not touched.
 */
export const DEMO_RUBROS = ["peluqueria", "taller", "profesionales", "otro"] as const;

export type DemoRubro = (typeof DEMO_RUBROS)[number];

/**
 * Request body of `POST /api/demos`. Every external input is validated here
 * (ruling R21): the rubro is a closed enum, the message is trimmed and capped at
 * 300 chars so a huge payload can never multiply the model cost, and the
 * `sessionId` is optional metadata only — it is never a dimension of the rate
 * limit (ruling R17, the client controls it).
 */
export const demoRequestSchema = z.object({
  rubro: z.enum(DEMO_RUBROS),
  message: z.string().trim().min(1).max(300),
  sessionId: z.string().trim().max(64).optional(),
});

export type DemoRequest = z.infer<typeof demoRequestSchema>;
export type DemoResponse = { reply: string };
