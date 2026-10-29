import { buildPrompt } from "@/lib/knowledge/prompt";

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export async function ollamaGenerate(
  request: OllamaGenerateRequest,
  baseUrl?: string
): Promise<OllamaGenerateResponse> {
  const url = `${baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://172.18.0.1:11434"}/api/generate`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, stream: false }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Ollama error: ${response.status} ${JSON.stringify(error)}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Ollama request timeout");
    }
    throw error;
  }
}

export async function ollamaClassifyIntent(
  message: string,
  history: Array<{ role: string; content: string }>,
  baseUrl?: string
): Promise<{ intent: string; confidence: number }> {
  const systemPrompt = `Eres un clasificador de intenciones para un asistente virtual por WhatsApp.
Clasifica el mensaje del cliente en UNA de estas categorias:
- "simple": consultas basicas (horarios, ubicacion, servicios, saludos, gracias)
- "agendamiento": solicitud de turno, cita, agendar, reprogramar, cancelar turno
- "reclamo": queja, problema, insatisfaccion, facturacion incorrecta
- "otro": todo lo que no encaje en lo anterior

Responde SOLO con JSON valido: {"intent": "categoria", "confidence": 0.0-1.0}`;

  const prompt = `Historial reciente:
${history.map((h) => `${h.role}: ${h.content}`).join("\n")}

Mensaje actual: "${message}"

Clasifica:`;

  const response = await ollamaGenerate({
    model: "mistral",
    system: systemPrompt,
    prompt,
    options: { temperature: 0.1, num_predict: 100 },
  }, baseUrl);

  try {
    const parsed = JSON.parse(response.response.trim());
    return {
      intent: parsed.intent ?? "otro",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    };
  } catch {
    return { intent: "otro", confidence: 0.3 };
  }
}

export async function ollamaGenerateResponse(
  message: string,
  history: Array<{ role: string; content: string }>,
  config: {
    tone: string;
    knowledgeBase: string;
    maxTokens: number;
    businessHours?: string;
  },
  baseUrl?: string
): Promise<{ text: string; tokensUsed: number }> {
  const systemPrompt = buildPrompt({
    tone: config.tone,
    knowledgeBase: config.knowledgeBase,
    businessHours: config.businessHours,
  });

  const prompt = `Historial:
${history.map((h) => `${h.role}: ${h.content}`).join("\n")}

Cliente: ${message}

Asistente:`;

  const response = await ollamaGenerate({
    model: "mistral",
    system: systemPrompt,
    prompt,
    options: { temperature: 0.7, num_predict: config.maxTokens },
  }, baseUrl);

  return {
    text: response.response.trim(),
    tokensUsed: response.eval_count ?? 0,
  };
}