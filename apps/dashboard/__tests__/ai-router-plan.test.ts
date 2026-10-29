import { beforeEach, describe, expect, it, vi } from "vitest";

const { ollamaClassifyIntent, ollamaGenerateResponse } = vi.hoisted(() => ({
  ollamaClassifyIntent: vi.fn(),
  ollamaGenerateResponse: vi.fn(),
}));
const { openRouterClassifyIntent, openRouterGenerateResponse } = vi.hoisted(() => ({
  openRouterClassifyIntent: vi.fn(),
  openRouterGenerateResponse: vi.fn(),
}));

vi.mock("@/lib/ai/ollama-client", () => ({
  ollamaClassifyIntent,
  ollamaGenerateResponse,
}));
vi.mock("@/lib/ai/openrouter-client", () => ({
  openRouterClassifyIntent,
  openRouterGenerateResponse,
}));

import {
  classifyIntent,
  generateResponse,
  preferLocalAiForPlan,
  shouldUseCloudForPlan,
  shouldUseOpenRouterForPlan,
  modelForPlan,
  routeForPlan,
  modelPolicyForPlan,
} from "@/lib/ai/router";
import { DEFAULT_WHATSAPP_CONFIG } from "@/lib/whatsapp/config";

beforeEach(() => {
  ollamaClassifyIntent.mockReset();
  ollamaGenerateResponse.mockReset();
  openRouterClassifyIntent.mockReset();
  openRouterGenerateResponse.mockReset();

  ollamaClassifyIntent.mockResolvedValue({ intent: "simple", confidence: 0.95 });
  openRouterClassifyIntent.mockResolvedValue({ intent: "simple", confidence: 0.96 });
  ollamaGenerateResponse.mockResolvedValue({ text: "local", tokensUsed: 5 });
  openRouterGenerateResponse.mockResolvedValue({ text: "cloud", tokensUsed: 7 });
});

describe("ai router plan policy", () => {
  it("starter and growth prefer local ai", () => {
    expect(preferLocalAiForPlan("starter")).toBe(true);
    expect(preferLocalAiForPlan("growth")).toBe(true);
    expect(preferLocalAiForPlan("elite")).toBe(false);
  });

  it("only elite uses cloud by default", () => {
    expect(shouldUseCloudForPlan("starter")).toBe(false);
    expect(shouldUseCloudForPlan("growth")).toBe(false);
    expect(shouldUseCloudForPlan("elite")).toBe(true);
    expect(shouldUseOpenRouterForPlan("elite")).toBe(true);
  });

  it("maps plans to models and routes", () => {
    expect(modelForPlan("starter")).toBe("ollama");
    expect(modelForPlan("elite")).toBe("openrouter");
    expect(routeForPlan("starter")).toBe("local");
    expect(routeForPlan("elite")).toBe("cloud");
  });

  it("returns a policy object", () => {
    const policy = modelPolicyForPlan("elite") as { useOpenRouter: boolean; preferLocalAi: boolean };
    expect(policy.useOpenRouter).toBe(true);
    expect(policy.preferLocalAi).toBe(false);
  });

  it("classifies starter simple messages locally", async () => {
    const result = await classifyIntent("hola", [], { ...DEFAULT_WHATSAPP_CONFIG }, "starter");
    expect(result.useOpenRouter).toBe(false);
    expect(openRouterClassifyIntent).not.toHaveBeenCalled();
  });

  it("classifies elite messages in the cloud", async () => {
    const result = await classifyIntent("hola", [], { ...DEFAULT_WHATSAPP_CONFIG }, "elite");
    expect(result.useOpenRouter).toBe(true);
    expect(openRouterClassifyIntent).toHaveBeenCalled();
  });

  it("generates with cloud for elite plan", async () => {
    const result = await generateResponse("hola", [], { ...DEFAULT_WHATSAPP_CONFIG }, "elite");
    expect(result.usedOpenRouter).toBe(true);
    expect(result.text).toBe("cloud");
  });

  it("generates locally for starter plan", async () => {
    const result = await generateResponse("hola", [], { ...DEFAULT_WHATSAPP_CONFIG }, "starter");
    expect(result.usedOpenRouter).toBe(false);
    expect(result.text).toBe("local");
  });
});