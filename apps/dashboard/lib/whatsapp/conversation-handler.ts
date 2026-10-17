import { ollamaGenerate } from "../ai/ollama-client";
import {
  WhatsAppConversationStep,
  WhatsAppConversationState,
  WHATSAPP_CONVERSATION_PROMPTS,
} from "./conversation-steps";

/**
 * Obtiene el prompt sistemático y de usuario para el paso actual de conversación
 */
export function getConversationPrompt(step: WhatsAppConversationStep, businessInfo?: { name: string; category: string } | null, history: Array<{ role: string; content: string }> = []): { system: string; user: string } {
  const promptData = WHATSAPP_CONVERSATION_PROMPTS[step];

  // Formatear prompt de usuario con info de negocio si está disponible
  let userPrompt = promptData.prompt;
  
  if (businessInfo) {
    userPrompt = userPrompt.replace(
      "What type of business do you have? (rubro: peluquería, restaurante, consultoría, construcción, etc.)",
      `Mi negocio es: ${businessInfo.name}. Es un negocio de ${businessInfo.category}.`
    );
  }

  // Agregar historial al prompt del sistema
  let systemPrompt = promptData.system;
  if (history.length > 0) {
    systemPrompt += `\n\nHistorial de la conversación:\n${history.map(h => `${h.role}: ${h.content}`).join("\n")}`;
  }

  return { system: systemPrompt, user: userPrompt };
}

/**
 * Envía un mensaje a Ollama y obtiene la respuesta para el paso de conversación actual
 */
export async function getOllamaResponse(
  step: WhatsAppConversationStep,
  message: string,
  history: Array<{ role: string; content: string }> = [],
  businessInfo?: { name: string; category: string } | null
): Promise<{ text: string; step: WhatsAppConversationStep; completed: boolean }> {
  const { system, user } = getConversationPrompt(step, businessInfo, history);

  const response = await ollamaGenerate({
    model: "gemma3:1b",
    system,
    prompt: `${user}\n\nUsuario: "${message}"`,
    options: { temperature: 0.7, num_predict: 500 },
  });

  const assistantText = response.response.trim();

  // Determinar si la conversación llegó a un punto de finalización o necesita continuar
  let completed = false;
  let nextStep = step;

  // Lógica simple de transición de pasos basada en el contenido de la respuesta
  if (step === "greeting" && /^(sí|si|clear|entendido|ok|ya)$/i.test(message)) {
    nextStep = "diagnosis";
    completed = false;
  } else if (step === "diagnosis" && /^(1|2|3|option|plan|me interesa)/i.test(message)) {
    nextStep = "results";
    completed = false;
  } else if (step === "results") {
    // Si el usuario dice gracias, adiós o termina la conversación
    if (/^(gracias|muchas|gracias adiós|chao|hasta luego|finish|end)$/i.test(message)) {
      nextStep = "finished";
      completed = true;
    }
  } else if (step === "finished") {
    completed = true;
  }

  return {
    text: assistantText,
    step: nextStep,
    completed,
  };
}

/**
 * Procesa un mensaje entrante de WhatsApp y retorna la respuesta y el nuevo estado
 */
export async function processWhatsAppMessage(
  message: string,
  currentStep: WhatsAppConversationStep,
  history: Array<{ role: string; content: string }> = [],
  businessInfo?: { name: string; category: string } | null
): Promise<{
  response: string;
  nextStep: WhatsAppConversationStep;
  completed: boolean;
  shouldEscalate: boolean;
}> {
  const result = await getOllamaResponse(currentStep, message, history, businessInfo);

  // Determinar si escalar a humano
  const escalationKeywords = ["humano", "persona", "agente", "reclamo", "queja", "malo", "problemática"];
  const shouldEscalate = escalationKeywords.some(kw => result.text.toLowerCase().includes(kw.toLowerCase())) || 
    /(hablame con un|quiero hablar|atención al cliente|denuncia|reclamo)/i.test(message);

  return {
    response: result.text,
    nextStep: result.step,
    completed: result.completed || shouldEscalate,
    shouldEscalate,
  };
}

/**
 * Estado inicial para iniciar una nueva conversación WhatsApp
 */
export const INITIAL_WHATSAPP_STATE: WhatsAppConversationState = {
  step: "greeting",
  businessInfo: null,
  diagnosed: false,
  readyToSchedule: false,
  conversationId: "",
  turnCount: 0,
};

/**
 * Genera el mensaje de bienvenida inicial para WhatsApp
 */
export function getWelcomeMessage(): string {
  return WHATSAPP_CONVERSATION_PROMPTS.greeting.prompt;
}