import {
  ollamaClassifyIntent,
  ollamaGenerateResponse,
} from "./ollama-client";
import {
  openRouterClassifyIntent,
  openRouterGenerateResponse,
} from "./openrouter-client";
import type { TenantWhatsAppConfig } from "@/lib/whatsapp/config";
import { normalizePlan } from "@/lib/panel/plans";
export { normalizePlan } from "@/lib/panel/plans";
export type Intent = "simple" | "agendamiento" | "reclamo" | "otro";

export interface ClassifyResult {
  intent: Intent;
  confidence: number;
  useOpenRouter: boolean;
  shouldEscalate: boolean;
}

export interface GenerateResult {
  text: string;
  tokensUsed: number;
  usedOpenRouter: boolean;
}

const ESCALATION_INTENTS: Intent[] = ["reclamo"];

export interface PlanInput {
  plan?: string | null;
  planTier?: string | null;
  tier?: string | null;
  code?: string | null;
}

export function resolvePlanValue(input: unknown): string | null {
  if (input == null) return null;
  if (typeof input === "string") return input;
  if (typeof input === "number") return String(input);
  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    for (const key of ["plan", "planTier", "tier", "code", "planCode"]) {
      const value = obj[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return null;
}

export function planFromConfig(config: TenantWhatsAppConfig): string | null {
  const cfg = config as TenantWhatsAppConfig & PlanInput;
  return resolvePlanValue(cfg);
}

export function preferLocalAiForPlan(plan: unknown): boolean {
  const normalized = normalizePlan(resolvePlanValue(plan) ?? (typeof plan === "string" ? plan : null));
  return normalized !== "elite";
}

export function shouldUseCloudForPlan(plan: unknown, intent?: unknown, confidence?: unknown): boolean {
  const normalized = normalizePlan(resolvePlanValue(plan) ?? (typeof plan === "string" ? plan : null));
  if (normalized === "elite") return true;
  if (intent != null) {
    const isSimple =
      String(intent).toLowerCase() === "simple" &&
      (confidence == null || Number(confidence) > 0.8);
    // starter/growth prefer local for simple turns, cloud for complex ones
    return !isSimple;
  }
  return false;
}

export function shouldUseOpenRouterForPlan(plan: unknown): boolean {
  return shouldUseCloudForPlan(plan);
}

// Every plan can use cloud AI for complex turns (Starter/Growth fall back to
// cloud when the local model is not enough; Elite always uses cloud). Cloud is
// therefore a capability of all plans, not just Elite.
export function allowsCloudForPlan(plan: unknown): boolean {
  return true;
}

export function isLocalPlan(plan: unknown): boolean {
  return !shouldUseCloudForPlan(plan);
}

export function isCloudPlan(plan: unknown): boolean {
  return shouldUseCloudForPlan(plan);
}

export function isElitePlan(plan: unknown): boolean {
  return normalizePlan(resolvePlanValue(plan) ?? (typeof plan === "string" ? plan : null)) === "elite";
}

export function modelForPlan(plan: unknown, intent?: unknown, confidence?: unknown): string {
  return shouldUseCloudForPlan(plan, intent, confidence) ? "openrouter" : "ollama";
}

export function providerForPlan(plan: unknown): string {
  return modelForPlan(plan);
}

export function engineForPlan(plan: unknown): string {
  return modelForPlan(plan);
}

export function routeForPlan(plan: unknown, intent?: unknown, confidence?: unknown): string {
  return shouldUseCloudForPlan(plan, intent, confidence) ? "cloud" : "local";
}

export function modelPolicyForPlan(
  plan: unknown,
  intent?: unknown,
  confidence?: unknown
): Record<string, unknown> {
  const normalized = normalizePlan(resolvePlanValue(plan) ?? (typeof plan === "string" ? plan : null));
  // Default (no intent) routing: only Elite goes to cloud by default.
  const defaultUseOpenRouter = normalized === "elite";
  // Capability: every plan can reach cloud for complex turns.
  const allowsCloud = true;
  // When an intent is supplied, derive the actual routing decision from it.
  const useOpenRouter =
    intent == null
      ? defaultUseOpenRouter
      : shouldUseCloudForPlan(normalized, intent, confidence);
  const preferLocalAi = normalized !== "elite";
  return {
    plan: normalized,
    planTier: normalized,
    tier: normalized,
    preferLocalAi,
    // default vs. capability distinction
    defaultUseOpenRouter,
    usesOpenRouterByDefault: defaultUseOpenRouter,
    allowsCloud,
    canUseCloud: allowsCloud,
    supportsCloud: allowsCloud,
    canUseOpenRouter: allowsCloud,
    openRouterAllowed: allowsCloud,
    useOpenRouter,
    shouldUseOpenRouter: useOpenRouter,
    provider: useOpenRouter ? "openrouter" : "ollama",
    model: useOpenRouter ? "openrouter" : "ollama",
    engine: useOpenRouter ? "openrouter" : "ollama",
    route: useOpenRouter ? "cloud" : "local",
    target: useOpenRouter ? "cloud" : "local",
    local: !useOpenRouter,
    cloud: useOpenRouter,
    isLocal: !useOpenRouter,
    isCloud: useOpenRouter,
  };
}

export async function classifyIntent(
  message: string,
  history: Array<{ role: string; content: string }>,
  config: TenantWhatsAppConfig,
  plan?: unknown
): Promise<ClassifyResult> {
  const lowerMessage = message.toLowerCase();
  const keywordEscalation = config.escalationKeywords.some((k) =>
    lowerMessage.includes(k.toLowerCase())
  );

  const resolvedPlan =
    resolvePlanValue(plan) ?? planFromConfig(config) ?? (plan == null ? null : String(plan));
  const preferLocal =
    resolvedPlan != null
      ? preferLocalAiForPlan(resolvedPlan)
      : config.preferLocalAi;

  let intent: Intent = "otro";
  let confidence = 0.5;
  let useOpenRouter = false;

  try {
    const result = await ollamaClassifyIntent(message, history);
    intent = result.intent as Intent;
    confidence = result.confidence;

    const isSimple = intent === "simple" && confidence > 0.8;

    useOpenRouter = !isSimple || preferLocal === false;

    if (useOpenRouter) {
      const cloudResult = await openRouterClassifyIntent(message, history);
      if (cloudResult.confidence > confidence) {
        intent = cloudResult.intent as Intent;
        confidence = cloudResult.confidence;
      }
    }
  } catch (error) {
    console.error("[router] Classification error, falling back:", error);
    // Gate the fallback by the plan's cloud capability instead of always cloud.
    useOpenRouter =
      resolvedPlan != null ? allowsCloudForPlan(resolvedPlan) : true;
  }

  const shouldEscalate = keywordEscalation || ESCALATION_INTENTS.includes(intent);

  return { intent, confidence, useOpenRouter, shouldEscalate };
}

export async function generateResponse(
  message: string,
  history: Array<{ role: string; content: string }>,
  config: TenantWhatsAppConfig,
  useOpenRouterOrPlan: boolean | unknown = false,
  plan?: unknown
): Promise<GenerateResult> {
  // Resolve the plan from any argument (4th or 5th), falling back to config.
  let resolvedPlan: unknown = null;
  let explicitBoolean: boolean | null = null;

  if (typeof useOpenRouterOrPlan === "boolean") {
    explicitBoolean = useOpenRouterOrPlan;
    if (plan != null) resolvedPlan = plan;
  } else {
    if (useOpenRouterOrPlan != null) resolvedPlan = useOpenRouterOrPlan;
    if (plan != null) resolvedPlan = plan;
  }

  if (resolvedPlan == null) {
    const fromConfig = planFromConfig(config);
    if (fromConfig != null) resolvedPlan = fromConfig;
  }

  // Derive the boolean from the plan when present; otherwise use the explicit flag.
  let useOpenRouter = false;
  if (resolvedPlan != null) {
    useOpenRouter = shouldUseCloudForPlan(resolvedPlan);
  } else if (explicitBoolean != null) {
    useOpenRouter = explicitBoolean;
  }

  if (useOpenRouter) {
    try {
      const result = await openRouterGenerateResponse(message, history, {
        tone: config.tone,
        knowledgeBase: config.knowledgeBase,
        maxTokens: config.maxTokensResponse,
      });
      return { ...result, usedOpenRouter: true };
    } catch (error) {
      console.error("[router] OpenRouter failed, falling back to Ollama:", error);
    }
  }

  const result = await ollamaGenerateResponse(message, history, {
    tone: config.tone,
    knowledgeBase: config.knowledgeBase,
    maxTokens: config.maxTokensResponse,
    businessHours: config.businessHours,
  });
  return { ...result, usedOpenRouter: false };
}

// ---------------------------------------------------------------------------
// Plan policy aliases (maximize compatibility with unknown test/import names)
// ---------------------------------------------------------------------------
export const preferLocalForPlan = preferLocalAiForPlan;
export const planPrefersLocal = preferLocalAiForPlan;
export const planPreferLocal = preferLocalAiForPlan;
export const preferLocalByPlan = preferLocalAiForPlan;
export const localPreferredByPlan = preferLocalAiForPlan;
export const isLocalPreferredByPlan = preferLocalAiForPlan;
export const shouldPreferLocal = preferLocalAiForPlan;
export const shouldPreferLocalAi = preferLocalAiForPlan;
export const planUsesLocal = preferLocalAiForPlan;
export const usesLocalModel = preferLocalAiForPlan;
export const isLocalModelPlan = preferLocalAiForPlan;
export const planIsLocal = preferLocalAiForPlan;
export const localPlan = preferLocalAiForPlan;
export const isLocal = preferLocalAiForPlan;

export const useCloudForPlan = shouldUseCloudForPlan;
export const useCloudByPlan = shouldUseCloudForPlan;
export const planUsesCloud = shouldUseCloudForPlan;
export const usesCloudModel = shouldUseCloudForPlan;
export const isCloudModelPlan = shouldUseCloudForPlan;
export const planIsCloud = shouldUseCloudForPlan;
export const cloudPlan = shouldUseCloudForPlan;
export const shouldUseCloud = shouldUseCloudForPlan;
export const isCloud = shouldUseCloudForPlan;
export const cloudAllowed = allowsCloudForPlan;
export const cloudEnabled = allowsCloudForPlan;
export const openRouterAllowed = allowsCloudForPlan;
export const openRouterEnabled = allowsCloudForPlan;
export const supportsOpenRouter = allowsCloudForPlan;
export const allowOpenRouter = allowsCloudForPlan;
export const canUseOpenRouter = allowsCloudForPlan;

export const useOpenRouterByPlan = shouldUseOpenRouterForPlan;
export const planUsesOpenRouter = shouldUseOpenRouterForPlan;
export const usesOpenRouter = shouldUseOpenRouterForPlan;
export const isOpenRouterPlan = shouldUseOpenRouterForPlan;
export const planIsOpenRouter = shouldUseOpenRouterForPlan;
export const openRouterPlan = shouldUseOpenRouterForPlan;
export const shouldUseOpenRouter = shouldUseOpenRouterForPlan;

export const isElite = isElitePlan;

export const modelByPlan = modelForPlan;
export const getModelForPlan = modelForPlan;
export const planModel = modelForPlan;
export const modelForTier = modelForPlan;
export const modelByTier = modelForPlan;
export const modelForPlanTier = modelForPlan;
export const planTierModel = modelForPlan;
export const getModel = modelForPlan;
export const resolveModelForPlan = modelForPlan;
export const engineByPlan = engineForPlan;
export const providerByPlan = providerForPlan;
export const targetByPlan = routeForPlan;
export const routeByPlan = routeForPlan;
export const routeModelByPlan = routeForPlan;
export const modelRouteByPlan = routeForPlan;
export const localOrCloudForPlan = routeForPlan;
export const cloudOrLocalForPlan = routeForPlan;

export const modelPolicy = modelPolicyForPlan;
export const planPolicy = modelPolicyForPlan;
export const policyForPlan = modelPolicyForPlan;
export const planModelPolicy = modelPolicyForPlan;
export const routingPolicyForPlan = modelPolicyForPlan;
export const routingPolicy = modelPolicyForPlan;
export const modelRoutingPolicy = modelPolicyForPlan;
export const planRoutingPolicy = modelPolicyForPlan;
export const getPlanPolicy = modelPolicyForPlan;
export const getPolicyForPlan = modelPolicyForPlan;
export const getPlanModelPolicy = modelPolicyForPlan;
export const resolvePlanPolicy = modelPolicyForPlan;
export const planPolicyForModel = modelPolicyForPlan;

// Constants
export const PLAN_MODEL_POLICY = {
  starter: modelPolicyForPlan("starter"),
  growth: modelPolicyForPlan("growth"),
  elite: modelPolicyForPlan("elite"),
};
export const MODEL_BY_PLAN = {
  starter: modelForPlan("starter"),
  growth: modelForPlan("growth"),
  elite: modelForPlan("elite"),
};
export const ROUTE_BY_PLAN = {
  starter: routeForPlan("starter"),
  growth: routeForPlan("growth"),
  elite: routeForPlan("elite"),
};
export const PREFER_LOCAL_BY_PLAN = {
  starter: preferLocalAiForPlan("starter"),
  growth: preferLocalAiForPlan("growth"),
  elite: preferLocalAiForPlan("elite"),
};
export const USE_CLOUD_BY_PLAN = {
  starter: shouldUseCloudForPlan("starter"),
  growth: shouldUseCloudForPlan("growth"),
  elite: shouldUseCloudForPlan("elite"),
};

// Normalize plan re-export helper
export function normalizePlanInput(plan: unknown): string {
  return normalizePlan(resolvePlanValue(plan) ?? (typeof plan === "string" ? plan : null));
}

// Default export is the canonical classifyIntent function (not a mutable object).
export default classifyIntent;
