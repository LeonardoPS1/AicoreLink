/**
 * Attention test — pure scoring behind the public lead magnet
 * "¿Qué tan bien atiende tu negocio?" at /herramientas/test-atencion.
 *
 * Eight yes/no questions map to the eight pains of §10.3. Every "no" is a gap
 * the visitor could close, and the score is the weighted share of "yes" answers.
 * Kept free of React, `Date` and browser APIs so the same function runs in the
 * component and in a plain Node test (mirrors `lib/tools/calculator.ts`).
 */

export type AttentionQuestion = { id: string; prompt: string; gap: string };
/** Maps a question id to the visitor's answer. */
export type AttentionAnswers = Record<string, boolean>;
/** `score` is 0..100; `gaps` lists missed opportunities in questionnaire order. */
export type AttentionResult = { score: number; gaps: string[] };

/**
 * The questionnaire (ruling R12). Each question targets one of the eight pains
 * of §10.3; its `gap` is the opportunity a "no" leaves on the table.
 */
export const ATTENTION_QUESTIONS: AttentionQuestion[] = [
  {
    id: "respuesta_rapida",
    prompt: "¿Respondes los mensajes de WhatsApp el mismo día?",
    gap: "Tus clientes que preguntan y no reciben respuesta a tiempo.",
  },
  {
    id: "fuera_horario",
    prompt: "¿Contestas consultas fuera de tu horario (noches o fines de semana)?",
    gap: "Las consultas que llegan cuando el negocio está cerrado.",
  },
  {
    id: "google",
    prompt: "¿Apareces en Google cuando alguien busca tu servicio en tu comuna?",
    gap: "Los clientes que te buscan en Google y no te encuentran.",
  },
  {
    id: "agenda_auto",
    prompt: "¿Tus clientes pueden agendar solos, sin que tú contestes uno por uno?",
    gap: "Las horas que pierdes coordinando citas a mano.",
  },
  {
    id: "recordatorios",
    prompt: "¿Envías recordatorios automáticos antes de cada cita?",
    gap: "Las citas que se pierden por falta de recordatorio.",
  },
  {
    id: "resenas",
    prompt: "¿Pides reseñas de forma automática después de cada atención?",
    gap: "Las reseñas que nunca llegan porque nadie las pide.",
  },
  {
    id: "telefono",
    prompt: "¿Alguien atiende el teléfono cuando estás trabajando?",
    gap: "Las llamadas que se pierden mientras atiendes.",
  },
  {
    id: "un_lugar",
    prompt: "¿Tienes mensajes, agenda y clientes en un solo lugar?",
    gap: "La información repartida entre WhatsApp, la agenda y una planilla.",
  },
];

/**
 * Scores the questionnaire (ruling R12):
 *
 *   score = round(100 * Σ(w_i · [answer_i]) / Σ(w_i over ANSWERED questions))
 *
 * Only answered questions count toward the denominator, so leaving one blank
 * neither helps nor hurts. Ids that are neither a question nor explicitly
 * weighted (e.g. a typo) are ignored. With no answers the result is 0 — never
 * `NaN`, which a caller could otherwise render.
 */
export function scoreAttention(
  answers: AttentionAnswers,
  weights: Record<string, number> = {},
): AttentionResult {
  let weightedYes = 0;
  let totalWeight = 0;
  const gaps: string[] = [];
  const scored = new Set<string>();

  // The questionnaire is scored in its canonical order so `gaps` reads the same
  // way for every visitor.
  for (const question of ATTENTION_QUESTIONS) {
    if (!Object.prototype.hasOwnProperty.call(answers, question.id)) continue;

    const weight = weights[question.id] ?? 1;
    totalWeight += weight;
    scored.add(question.id);

    if (answers[question.id] === true) {
      weightedYes += weight;
    } else {
      gaps.push(question.gap);
    }
  }

  // Ids that are not part of the questionnaire but were explicitly weighted are
  // scored too (they carry no gap text). This keeps the weighting usable for a
  // custom question set without letting a stray id inflate the score.
  for (const id of Object.keys(weights)) {
    if (scored.has(id) || !Object.prototype.hasOwnProperty.call(answers, id)) continue;

    const weight = weights[id];
    totalWeight += weight;
    if (answers[id] === true) weightedYes += weight;
  }

  if (totalWeight === 0) return { score: 0, gaps: [] };

  return { score: Math.round((100 * weightedYes) / totalWeight), gaps };
}
