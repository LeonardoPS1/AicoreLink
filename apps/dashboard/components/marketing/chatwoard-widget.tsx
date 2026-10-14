"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/marketing/copy";
import { cn } from "@/lib/utils";

/**
 * Chatwoard Widget - Integra chat flutuante con IA local (Ollama/Mistral)
 * Reemplaza el flujo Twilio directo con Chatwoard widget
 * 
 * Características:
 * - Tuteo chileno, sin voseo
 * - 4 pasos de conversación: greeting → diagnosis → results → finished
 * - Precios en CLP + IVA stated separately
 * - Escalado a humano opcional
 */
export function ChatwoardWidget() {
  const [visible, setVisible] = useState(false);
  const [conversationStep, setConversationStep] = useState<"greeting" | "diagnosis" | "results" | "finished">("greeting");
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Inicializar estado de conversación usando nuestro handler
  useEffect(() => {
    // El estado se manejaría en el backend, aquí inicializamos localmente
    setConversationStep("greeting");
    setMessages([{
      role: "assistant",
      content: getInitialMessage(),
    }]);
  }, []);

  // Manejo de entrada de usuario
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      // Enviar a nuestro handler de conversación
      const response = await fetch("/api/webhooks/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: conversationStep,
          message: userMessage,
          businessInfo: conversationStep === "diagnosis" ? { name: "Negocio", category: "por definir" } : undefined,
        }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      setConversationStep(data.nextStep);
      
      // Si la conversación terminó, ofrecer reiniciar
      if (data.completed) {
        setMessages(prev => [...prev, { role: "assistant", content: "¡Gracias por conversar! ¿Deseas comenzar un nuevo diagnóstico?" }]);
      }
    } catch (error) {
      console.error("Error en Chatwoard:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Disculpa, tuve un problema técnico. Intentalo de nuevo en unos momentos." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setConversationStep("greeting");
    setMessages([
      { role: "assistant", content: getInitialMessage() },
    ]);
    setInput("");
  };

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-40",
      visible ? "show" : "hidden",
      transition: "opacity 0.3s ease",
    )}>
      <div onClick={setVisible} className={cn(
        "cursor-pointer",
        visible ? "bg-[#25D366] text-white shadow-2xl" : "bg-gray-200 text-gray-800",
      )}>
        <svg viewBox="0 0 24 24" className={cn(
          "h-6 w-6",
          visible ? "stroke-white" : "stroke-gray-600",
        )}>
          <path d="M2.031 13.938l1.988-1.988 1.42 1.42L4.25 19.77l-1.72-1.72L2.031 13.938zM5.063 16.938l1.406-1.406 2.813 2.813L10.157 8l-3.125 3.125L5.063 16.938zM12 4l-1.406 1.406L10.25 8 15.75 8l1.406-1.406L12 4zM21.969 13.938l-1.988-1.988-1.42-1.42L19.75 4.23l1.72 1.72L21.969 13.938zM17.094 5.938l-2.813-2.813L13.875 2l2.813 2.813L17.094 5.938z"/>
        </svg>
      </div>

      {visible && (
        <div className="fixed top-20 right-0 w-80 z-50 bg-white shadow-2xl rounded-lg overflow-hidden max-h-80 flex flex-col">
          <div className="bg-[--aicore-primary] text-white px-4 py-3 text-sm font-medium">
            Asistente IA AicoreLink
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "mb-3",
                msg.role === "user" ? "self-end" : "self-start",
              )}>
                <div className={cn(
                  "max-w-xs p-3 rounded bg-[--aicore-teal] text-white",
                  msg.role === "user" ? "self-end" : "self-start",
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-gray-50">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe aquí..."
                disabled={loading}
                className="flex-1 px-3 py-2 rounded border"
                maxLength={500}
              />
              <button type="submit" disabled={loading} className="px-4 py-2 bg-[--aicore-teal] text-white rounded text-sm">
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </div>
          {conversationStep !== "greeting" && (
            <button
              onClick={handleRestart}
              className="p-2 text-xs text-[--aicore-teal] mt-2"
              style={{ borderRadius: '4px', border: '1px solid var(----aicore-teal)' }}
            >
              Reiniciar diagnóstico
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Obtiene el mensaje inicial basado en el paso actual
 */
function getInitialMessage(): string {
  switch ("greeting") {
    case "greeting":
      return "Hola! 👊 Estamos para ayudarte a crear un sitio web con IA para tu negocio. ¿Qué tipo de negocio tienes?";
    case "diagnosis":
      return "Perfecto, gracias. Voy a analizar tu negocio y mostrarte un diagnóstico personalizado.";
    case "results":
      return "Excelente. Aquí tienes 3 opciones para tu negocio: 1) Chat IA básico, 2) Chat IA + Agenda, 3) Chat IA + Recepciónista de voz.";
    case "finished":
      return "¡Gracias por conversar! Estamos aquí cuando nos necesites.";
  }
  return "Hola! ¿En qué puedo ayudarte?";
}

/**
 * Configuración de Chatwoard
 * URLs y tokens para integración
 */
export const CHATWOARD_CONFIG = {
  // URL del webhook para procesar mensajes
  webhookUrl: "/api/webhooks/whatsapp",
  
  // Tokens y configuración
  metadata: {
    company: "AicoreLink",
    primaryColor: "#25D366",  // Verde Aicore
    secondaryColor: "#0F172A", // Navy
    tone: "chilean_tuteo", // Siempre tuteo, nunca voseo
    aiModel: "gemma3:1b", // Ollama/Mistral en VPS
    language: "es-cl", // Español chileno
  },
  
  // Pasos de conversación
  steps: {
    greeting: "Inicio de conversación",
    diagnosis: "Diagnóstico de oportunidades",
    results: "Opciones de planes",
    finished: "Conversación finalizada",
  },
};