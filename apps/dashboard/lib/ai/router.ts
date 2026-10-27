import {
  ollamaClassifyIntent,
  ollamaGenerateResponse,
} from "./ollama-client";
import {
  openRouterClassifyIntent,
  openRouterGenerateResponse,
} from "./openrouter-client";
import type { TenantWhatsAppConfig } from "@/lib/whatsapp/config";

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

export async function classifyIntent(
  message: string,
  history: Array<{ role: string; content: string }>,
  config: TenantWhatsAppConfig
): Promise<ClassifyResult> {
  const lowerMessage = message.toLowerCase();
  const keywordEscalation = config.escalationKeywords.some((k) =>
    lowerMessage.includes(k.toLowerCase())
  );

  let intent: Intent = "otro";
  let confidence = 0.5;
  let useOpenRouter = false;

  try {
    const result = await ollamaClassifyIntent(message, history);
    intent = result.intent as Intent;
    confidence = result.confidence;

    const isSimple = intent === "simple" && confidence > 0.8;
    const preferLocal = config.preferLocalAi;

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
    useOpenRouter = true;
  }

  const shouldEscalate = keywordEscalation || ESCALATION_INTENTS.includes(intent);

  return { intent, confidence, useOpenRouter, shouldEscalate };
}

export async function generateResponse(
  message: string,
  history: Array<{ role: string; content: string }>,
  config: TenantWhatsAppConfig,
  useOpenRouter: boolean
): Promise<GenerateResult> {
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