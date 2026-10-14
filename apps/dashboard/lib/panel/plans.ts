/**
 * Canonical plan catalogue for the Aicore panel.
 *
 * This module is the single source of truth for the plan limits shown in the
 * panel ("ningún número hardcodeado en la UI"). The marketing copy of
 * `lib/marketing/copy.ts` stays the source of truth for marketing text only;
 * it is not derived from here and is not touched by this module.
 *
 * Quotas are copied verbatim from ALK-SRD-001 v2.0 §3.2 "Uso justo" (pp. 8-9).
 * Voice is Elite-only: the SRD prints "-" for Starter and Growth, so the other
 * two plans carry 0 minutes instead of a shared 120.
 *
 * The published prices (19990 / 49990 / 99990) sit inside the SRD's hypothesised
 * ranges and are the same three numbers already public in the marketing copy.
 */

export type PlanCode = "starter" | "growth" | "elite";

export interface PlanDefinition {
  code: PlanCode;
  label: string;
  /** Monthly price in CLP, IVA not included. */
  priceCLP: number;
  /** SRD §3.2 — AI conversations per month. */
  conversationsPerMonth: number;
  /** SRD §3.2 — content changes per month. */
  siteChangesPerMonth: number;
  /** SRD §3.2 — voice minutes per month. Elite only. */
  voiceMinutesPerMonth: number;
  /** SRD §3.2 — WhatsApp template messages per month. */
  templateMessagesPerMonth: number;
}

export const PLANS: Record<PlanCode, PlanDefinition> = {
  starter: {
    code: "starter",
    label: "Starter",
    priceCLP: 19990,
    conversationsPerMonth: 300,
    siteChangesPerMonth: 1,
    voiceMinutesPerMonth: 0,
    templateMessagesPerMonth: 0,
  },
  growth: {
    code: "growth",
    label: "Growth",
    priceCLP: 49990,
    conversationsPerMonth: 1500,
    siteChangesPerMonth: 3,
    voiceMinutesPerMonth: 0,
    templateMessagesPerMonth: 300,
  },
  elite: {
    code: "elite",
    label: "Elite",
    priceCLP: 99990,
    conversationsPerMonth: 5000,
    siteChangesPerMonth: 8,
    voiceMinutesPerMonth: 120,
    templateMessagesPerMonth: 1000,
  },
};

/** Sellable plans, in display order. */
export const PLAN_CODES: PlanCode[] = ["starter", "growth", "elite"];

/**
 * `Tenant.plan` is `@default("basico")` in the Prisma schema, so rows created
 * before the plan catalogue existed carry "basico". It is the legacy alias of
 * Starter (the "Semilla" plan was removed from the product).
 */
export const LEGACY_PLAN_ALIASES: Record<string, PlanCode> = { basico: "starter" };

/**
 * Normalizes any stored plan value (legacy alias, odd casing, null, or a value
 * typed by hand) into a plan we can render. Unknown values fall back to the
 * entry plan rather than breaking the panel or implying "no limit".
 */
export function normalizePlan(plan: string | null | undefined): PlanCode {
  const key = (plan ?? "").trim().toLowerCase();

  const aliased = LEGACY_PLAN_ALIASES[key];
  if (aliased) return aliased;

  if ((PLAN_CODES as string[]).includes(key)) return key as PlanCode;

  return "starter";
}

/** The definition of a stored plan value; never undefined. */
export function planDefinition(plan: string | null | undefined): PlanDefinition {
  return PLANS[normalizePlan(plan)];
}
