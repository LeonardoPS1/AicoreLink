export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: OpenRouterMessage;
    finish_reason: string;
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function openRouterGenerate(
  messages: OpenRouterMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<{ text: string; tokensUsed: number }> {
  const apiKey = process.env.AICORELINK_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("AICORELINK_OPENROUTER_API_KEY not set");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://aicorelink.aicorebots.com",
      "X-Title": "AicoreLink",
    },
    body: JSON.stringify({
      model: options.model ?? "z-ai/glm-4.5-air:free",
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 500,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter error: ${response.status} ${JSON.stringify(error)}`);
  }

  const data: OpenRouterResponse = await response.json();
  return {
    text: data.choices[0]?.message?.content ?? "",
    tokensUsed: data.usage?.total_tokens ?? 0,
  };
}

export async function openRouterClassifyIntent(
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<{ intent: string; confidence: number }> {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: `Eres un clasificador de intenciones para un asistente de clinica medica por WhatsApp.
Clasifica el mensaje del paciente en UNA de estas categorias:
- "simple": consultas basicas (horarios, ubicacion, servicios, saludos, gracias)
- "agendamiento": solicitud de turno, cita, agendar, reprogramar, cancelar turno
- "reclamo": queja, problema, insatisfaccion, error medico, facturacion incorrecta
- "otro": todo lo que no encaje en lo anterior

Responde SOLO con JSON valido: {"intent": "categoria", "confidence": 0.0-1.0}`,
    },
    {
      role: "user",
      content: `Historial reciente:\n${history.map((h) => `${h.role}: ${h.content}`).join("\n")}\n\nMensaje actual: "${message}"\n\nClasifica:`,
    },
  ];

  const response = await openRouterGenerate(messages, {
    model: "z-ai/glm-4.5-air:free",
    temperature: 0.1,
    max_tokens: 100,
  });

  try {
    const parsed = JSON.parse(response.text.trim());
    return {
      intent: parsed.intent ?? "otro",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    };
  } catch {
    return { intent: "otro", confidence: 0.3 };
  }
}

export async function openRouterGenerateResponse(
  message: string,
  history: Array<{ role: string; content: string }>,
  config: {
    tone: string;
    knowledgeBase: string;
    maxTokens: number;
  }
): Promise<{ text: string; tokensUsed: number }> {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content: `Eres un asistente virtual de una clinica medica.
Tono: ${config.tone}
Base de conocimiento/FAQ:
${config.knowledgeBase || "No hay informacion adicional."}

Responde de forma util, breve y profesional. No inventes informacion medica.
Si no sabes algo, di que un humano te contactara.`,
    },
    ...history.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    {
      role: "user",
      content: message,
    },
  ];

  const response = await openRouterGenerate(messages, {
    model: "z-ai/glm-4.5-air:free",
    temperature: 0.7,
    max_tokens: config.maxTokens,
  });

  return response;
}