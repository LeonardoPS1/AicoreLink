"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Conversation {
  id: string;
  contactRef: string;
  status: string;
  escalado: boolean;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

interface Message {
  id: string;
  direction: "in" | "out";
  content: string;
  aiGenerated: boolean;
  tokensUsed: number | null;
  createdAt: string;
}

export default function ConversacionesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "abierta" | "escalada" | "cerrada">("all");
  const [search, setSearch] = useState("");

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

  async function loadMessages(conversationId: string) {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/tenants/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Error al cargar mensajes");
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setMessagesLoading(false);
    }
  }

  function handleSelect(conversation: Conversation) {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  }

  useEffect(() => {
    loadConversations();
  }, [filter, search]);

  const filteredConversations = conversations.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (search && !c.contactRef.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Conversaciones WhatsApp</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Buscar por telefono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent text-sm"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent text-sm"
          >
            <option value="all">Todas</option>
            <option value="abierta">Abiertas</option>
            <option value="escalada">Escaladas</option>
            <option value="cerrada">Cerradas</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Lista de conversaciones</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mx-auto mb-2"></div>
                  Cargando...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No hay conversaciones</div>
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
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-navy text-white rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedConversation ? (
            <div className="bg-white rounded-lg border border-slate-200 flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {selectedConversation.contactRef}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        selectedConversation.status === "abierta"
                          ? "bg-green-100 text-green-700"
                          : selectedConversation.status === "escalada"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {selectedConversation.status}
                    </span>
                    {selectedConversation.escalado && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                        Escalada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    No hay mensajes
                  </div>
                ) : (
                  messages
                    .slice()
                    .reverse()
                    .map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direction === "out" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            msg.direction === "out"
                              ? "bg-navy text-white rounded-br-md"
                              : "bg-slate-100 text-slate-900 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span className="text-xs opacity-70">
                              {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {msg.aiGenerated && (
                              <span className="text-xs px-1.5 py-0.5 bg-white/20 rounded">
                                IA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-500 text-center">
                  Respuesta automatica via IA. Para responder manualmente, usa la app de WhatsApp
                  Business o contacta al paciente por telefono.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 h-[600px] flex items-center justify-center">
              <div className="text-center text-slate-500">
                <svg
                  className="mx-auto h-12 w-12 text-slate-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg">Selecciona una conversacion</p>
                <p className="text-sm mt-1">para ver el historial de mensajes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}