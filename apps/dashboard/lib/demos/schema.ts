import { z } from "zod";

/**
 * Verticals of the public live chat demo (plan §5.2). Deliberately separate from
 * the six marketing verticals in `lib/marketing/verticals.ts` (ruling R26): the
 * demo has its own four chips and that file is not touched.
 */
export const DEMO_RUBROS = ["peluqueria", "taller", "profesionales", "otro"] as const;

export type DemoRubro = (typeof DEMO_RUBROS)[number];

/**
 * One prior turn of the demo conversation. Capped exactly like the current
 * message so a crafted history can never smuggle a huge payload past the Zod
 * layer (ruling R21).
 */
export const demoHistoryEntrySchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(300),
});

export type DemoHistoryEntry = z.infer<typeof demoHistoryEntrySchema>;

/**
 * Request body of `POST /api/demos`. Every external input is validated here
 * (ruling R21): the rubro is a closed enum, the message is trimmed and capped at
 * 300 chars so a huge payload can never multiply the model cost, and the
 * `sessionId` is optional metadata only — it is never a dimension of the rate
 * limit (ruling R17, the client controls it).
 *
 * `history` is optional and bounded to the last 8 turns: the client sends the
 * conversation so far so a follow-up keeps its context, while an omitted history
 * behaves exactly as a single-turn request.
 */
export const demoRequestSchema = z.object({
  rubro: z.enum(DEMO_RUBROS),
  message: z.string().trim().min(1).max(300),
  sessionId: z.string().trim().max(64).optional(),
  history: z.array(demoHistoryEntrySchema).max(8).optional(),
});

export type DemoRequest = z.infer<typeof demoRequestSchema>;
export type DemoResponse = { reply: string };
