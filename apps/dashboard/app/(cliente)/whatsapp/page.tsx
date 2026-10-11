"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

interface TenantWhatsAppConfig {
  tone: "formal" | "amable" | "empatico";
  businessHours: string;
  knowledgeBase: string;
  autoReplyEnabled: boolean;
  preferLocalAi: boolean;
  maxTokensResponse: number;
  escalationKeywords: string[];
  escalationNotify: "email" | "telegram" | "none";
  escalationMessage: string;
  descripcion: string;
  voiceReplyEnabled: boolean;
  voiceId: string;
}

interface ChannelStatus {
  channel: string;
  enabled: boolean;
  config: TenantWhatsAppConfig;
}

export default function WhatsappPage() {
  const [config, setConfig] = useState<TenantWhatsAppConfig>({
    tone: "amable",
    businessHours: "09:00-18:00",
    knowledgeBase: "",
    autoReplyEnabled: true,
    preferLocalAi: false,
    maxTokensResponse: 500,
    escalationKeywords: ["humano", "persona", "agente", "reclamo", "queja"],
    escalationNotify: "none",
    escalationMessage: "Un agente humano se pondra en contacto contigo en breve.",
    descripcion: "",
    voiceReplyEnabled: false,
    voiceId: "21m00Tcm4TlvDq8ikWAM",
  });
  const [textEnabled, setTextEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "ia" | "escalado" | "voz">("general");

  async function loadConfig() {
    try {
      const res = await fetch("/api/tenants/channels");
      if (!res.ok) throw new Error("No se pudo cargar la configuracion");
      const data = await res.json();
      const whatsappText = data.find((c: ChannelStatus) => c.channel === "whatsapp_text");
      const whatsappVoice = data.find((c: ChannelStatus) => c.channel === "whatsapp_voice");
      if (whatsappText) {
        setTextEnabled(whatsappText.enabled);
        setConfig(whatsappText.config);
      }
      if (whatsappVoice) {
        setVoiceEnabled(whatsappVoice.enabled);
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Error al cargar configuracion" });
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/tenants/channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "whatsapp_text",
          enabled: textEnabled,
          config,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setMessage({ type: "success", text: "Configuracion guardada correctamente" });
    } catch (error) {
      setMessage({ type: "error", text: "Error al guardar configuracion" });
    } finally {
      setSaving(false);
    }
  }

  async function saveVoiceConfig() {
    setSaving(true);
    setMessage(null);
    try {
      if (voiceEnabled && !textEnabled) {
        throw new Error("No se puede activar WhatsApp Voz sin WhatsApp Texto activo");
      }
      const res = await fetch("/api/tenants/channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "whatsapp_voice",
          enabled: voiceEnabled,
          config,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setMessage({ type: "success", text: "Configuracion de voz guardada correctamente" });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Error al guardar configuracion" });
    } finally {
      setSaving(false);
    }
  }

  function handleKeywordChange(keywords: string) {
    setConfig((prev) => ({
      ...prev,
      escalationKeywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
    }));
  }

  useEffect(() => {
    loadConfig();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">WhatsApp</h1>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 text-sm font-medium transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex gap-1 p-1" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "general"
                  ? "bg-navy text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("ia")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "ia"
                  ? "bg-navy text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              IA
            </button>
            <button
              onClick={() => setActiveTab("escalado")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "escalado"
                  ? "bg-navy text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Escalado
            </button>
            <button
              onClick={() => setActiveTab("voz")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "voz"
                  ? "bg-navy text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Voz
            </button>
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tono de respuesta
                </label>
                <select
                  value={config.tone}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, tone: e.target.value as any }))
                  }
                  className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                >
                  <option value="formal">Formal</option>
                  <option value="amable">Amable</option>
                  <option value="empatico">Empatico</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Horario de atención (ej. 09:00-18:00)
                </label>
                <input
                  type="text"
                  value={config.businessHours}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, businessHours: e.target.value }))
                  }
                  className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Base de conocimiento / FAQ
                </label>
                <textarea
                  value={config.knowledgeBase}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, knowledgeBase: e.target.value }))
                  }
                  rows={6}
                  className="w-full max-w-2xl px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent font-mono text-sm"
                  placeholder="Ej: La clínica abre de lunes a viernes 9 a 18hs. Dirección: Av. Siempre Viva 123. Servicios: Clínica general, Pediatría, Cardiología..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción del canal (visible para los pacientes)
                </label>
                <textarea
                  value={config.descripcion || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                  rows={3}
                  className="w-full max-w-2xl px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent font-mono text-sm"
                  placeholder="Ej: Atención al paciente para consultas médicas y turnos"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoReply"
                  checked={config.autoReplyEnabled}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, autoReplyEnabled: e.target.checked }))
                  }
                  className="w-5 h-5 text-navy border-slate-300 rounded focus:ring-navy"
                />
                <label htmlFor="autoReply" className="text-sm text-slate-700">
                  Respuesta automática habilitada
                </label>
              </div>
            </div>
          )}

          {activeTab === "ia" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="preferLocalAi"
                  checked={config.preferLocalAi}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, preferLocalAi: e.target.checked }))
                  }
                  className="w-5 h-5 text-navy border-slate-300 rounded focus:ring-navy"
                />
                <label htmlFor="preferLocalAi" className="text-sm text-slate-700">
                  Preferir IA local (Ollama) sobre OpenRouter
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Máximo tokens por respuesta
                </label>
                <input
                  type="number"
                  min="100"
                  max="2000"
                  value={config.maxTokensResponse}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      maxTokensResponse: parseInt(e.target.value) || 500,
                    }))
                  }
                  className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
                <p className="font-medium mb-1">Modelos utilizados:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Local (Ollama): Gemma 3 1B - Clasificación y respuestas simples</li>
                  <li>Cloud (OpenRouter): GLM 4.5 Air - Respuestas complejas, agendamiento, reclamos</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "escalado" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Palabras clave de escalado (separadas por coma)
                </label>
                <input
                  type="text"
                  value={config.escalationKeywords?.join(", ") || ""}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  className="w-full max-w-2xl px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Si el paciente escribe alguna de estas palabras, la conversación se marca como
                  escalada y se notifica al staff.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notificar escalado por
                </label>
                <select
                  value={config.escalationNotify || "none"}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      escalationNotify: e.target.value as any,
                    }))
                  }
                  className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                >
                  <option value="none">Ninguna (solo marca en panel)</option>
                  <option value="email">Email</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mensaje automático al escalar
                </label>
                <textarea
                  value={config.escalationMessage || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, escalationMessage: e.target.value }))
                  }
                  rows={3}
                  className="w-full max-w-2xl px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>
            </div>
          )}

          {activeTab === "voz" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="voiceEnabled"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  disabled={!textEnabled}
                  className="w-5 h-5 text-navy border-slate-300 rounded focus:ring-navy disabled:opacity-50"
                />
                <label htmlFor="voiceEnabled" className="text-sm text-slate-700">
                  {textEnabled ? "Activar WhatsApp Voz" : "Requiere WhatsApp Texto activo"}
                </label>
              </div>

              {!textEnabled && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  Debes activar primero el canal "WhatsApp Texto" para poder usar WhatsApp Voz.
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="voiceReplyEnabled"
                  checked={config.voiceReplyEnabled}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, voiceReplyEnabled: e.target.checked }))
                  }
                  disabled={!voiceEnabled}
                  className="w-5 h-5 text-navy border-slate-300 rounded focus:ring-navy disabled:opacity-50"
                />
                <label htmlFor="voiceReplyEnabled" className="text-sm text-slate-700">
                  Responder en audio (nota de voz)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Voice ID (ElevenLabs)
                </label>
                <input
                  type="text"
                  value={config.voiceId}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, voiceId: e.target.value }))
                  }
                  disabled={!voiceEnabled}
                  className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-slate-500">
                  ID de la voz de ElevenLabs. Default: Rachel (21m00Tcm4TlvDq8ikWAM)
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
                <p className="font-medium mb-1">Cómo funciona:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>El paciente envía una nota de voz</li>
                  <li>Se transcribe automáticamente con Whisper</li>
                  <li>Se procesa igual que un mensaje de texto (pipeline IA existente)</li>
                  <li>Si "Responder en audio" está activo, la respuesta se genera con ElevenLabs y se envía como nota de voz</li>
                  <li>Si está desactivado, la respuesta llega en texto</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-6 flex justify-end">
          <button
            onClick={activeTab === "voz" ? saveVoiceConfig : saveConfig}
            disabled={saving}
            className="px-6 py-2 bg-navy text-white rounded-md hover:bg-navy/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Webhook de Meta</h3>
        <p className="text-sm text-blue-700 mb-2">
          Configura la URL del webhook en Meta Developer Console:
        </p>
        <code className="text-sm text-blue-900 bg-blue-100 px-2 py-1 rounded">
          https://your-domain.com/api/webhooks/whatsapp
        </code>
        <p className="text-xs text-blue-600 mt-2">
          Verify Token: configurar en variables de entorno (META_VERIFY_TOKEN)
        </p>
      </div>
    </div>
  );
}