"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Message {
  id: string;
  direction: "in" | "out";
  content: string;
  aiGenerated: boolean;
  tokensUsed: number | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  contactRef: string;
  status: string;
  escalado: boolean;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  lastMessageObj?: Message;
}

interface ChannelStatus {
  channel: string;
  enabled: boolean;
  config: {
    tone: string;
    autoReplyEnabled: boolean;
  };
}

export default function DashboardPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "abierta" | "escalada" | "cerrada">("all");
  const [search, setSearch] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  async function loadMessages(conversationId: string) {
    // In a full implementation, this would fetch messages from the API
    // For now, we just set the selected conversation and the UI will show its messages
    setSelectedConversation(
      conversations.find((c) => c.id === conversationId) ?? null
    );
  }
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [metrics, setMetrics] = useState({
    messagesIn: 0,
    messagesOut: 0,
    tokensUsed: 0,
    costEstimate: 0,
  });

  async function handleSelect(conversation: Conversation) {
    // Mark messages as read by loading the full conversation
    await loadMessages(conversation.id);
    setSelectedConversation(conversation);
  }

  useEffect(() => {
    async function loadConversations() {
      try {
        const params = new URLSearchParams();
        if (filter !== "all") params.set("status", filter);
        if (search) params.set("search", search);
        const res = await fetch(`/api/tenants/conversations?${params.toString()}`);
        if (!res.ok) throw new Error("Error al cargar conversaciones");
        const data = await res.json();
        setConversations(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    async function loadChannels() {
      try {
        const res = await fetch("/api/tenants/channels");
        if (!res.ok) throw new Error("Error al cargar canales");
        const data = await res.json();
        setChannels(data as ChannelStatus[]);
      } catch (error) {
        console.error(error);
      }
    }

    async function loadMetrics() {
      try {
        const res = await fetch("/api/tenants/metrics");
        if (!res.ok) throw new Error("Error al cargar métricas");
        const data = await res.json();
        setMetrics(data as {
          messagesIn: number;
          messagesOut: number;
          tokensUsed: number;
          costEstimate: number;
        });
      } catch (error) {
        console.error(error);
      }
    }

    loadConversations();
    loadChannels();
    loadMetrics();
  }, [filter, search]);

  const filteredConversations = conversations.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (search && !c.contactRef.includes(search)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-navy flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2v4m7-4h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a2 2 0 012-2z"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">AicoreLink</h2>
                <p className="text-sm text-slate-500">Panel de control</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                {new Date().toLocaleDateString("es-AR")}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-medium text-slate-700 mb-4">Clínica Demo</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Plan:</span>
                <span className="font-medium">Pro</span>
              </div>
              <div>
                <span className="text-slate-500">Status:</span>
                <span className={["font-medium", "text-green-600", "activo" === "activo" ? "text-green-600" : "text-red-500"].filter(Boolean).join(" ")}>
                  Activo
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-medium text-slate-700 mb-4">Canales WhatsApp</h3>
            <div className="grid grid-cols-2 gap-3">
              {channels.map((ch) => (
                <div
                  key={ch.channel}
                  className={`p-3 rounded-md ${
                    ch.enabled
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-500"
                  }`}
                >
                  <span className="font-medium">{ch.channel}</span>
                  <span className="ml-auto">{ch.enabled ? "Activo" : "Inactivo"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="font-medium text-slate-700 mb-4">Métricas Mensuales</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500">Entrantes:</span>
                <span className="font-medium">{metrics.messagesIn}</span>
              </div>
              <div>
                <span className="text-slate-500">Salientes:</span>
                <span className="font-medium">{metrics.messagesOut}</span>
              </div>
              <div>
                <span className="text-slate-500">Tokens:</span>
                <span className="font-medium">{metrics.tokensUsed}</span>
              </div>
              <div>
                <span className="text-slate-500">Costo:</span>
                <span className="font-medium">${metrics.costEstimate.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-6 bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex gap-1 p-1" aria-label="Tabs">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-navy text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todas {conversations.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-navy text-white rounded-full">
                    {conversations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter("abierta")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === "abierta"
                    ? "bg-navy text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Abiertas
              </button>
              <button
                onClick={() => setFilter("escalada")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === "escalada"
                    ? "bg-navy text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Escaladas
                {filteredConversations.filter((c) => c.escalado).length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                    {filteredConversations.filter((c) => c.escalado).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter("cerrada")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === "cerrada"
                    ? "bg-navy text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cerradas
              </button>
            </nav>
          </div>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
                <span className="ml-4 text-slate-500">Cargando...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mx-auto mb-2"></div>
                <span>No hay conversaciones</span>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredConversations.map((conv) => (
                  <li
                    key={conv.id}
                    onClick={() => handleSelect(conv)}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id ? "bg-navy/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 truncate">
                            {conv.contactRef}
                          </span>
                          {conv.escalado && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                              Escalada
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            conv.status === "abierta"
                              ? "bg-green-100 text-green-700"
                              : conv.status === "escalada"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {conv.status}
                        </span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-navy text-white rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-slate-500 truncate mt-1">
                        {conv.lastMessage}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(conv.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {conv.lastMessageObj && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-md text-xs text-slate-600">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="opacity-60 text-xs">{new Date(
                            conv.lastMessageObj.createdAt
                          ).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                          {conv.lastMessageObj.aiGenerated && (
                            <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                              IA
                            </span>
                          )}
                        </div>
                        <p className="truncate text-slate-400 line-clamp-2">
                          {conv.lastMessageObj?.content}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}