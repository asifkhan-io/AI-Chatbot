"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Conversation, Message } from "@/lib/types";

const STORAGE_KEY = "chat-conversations-v2";
const PERSONA_KEY = "chat-persona";

const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const makeConversation = (): Conversation => ({
  id: newId(),
  title: "New chat",
  messages: [],
  updatedAt: Date.now(),
});

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: Conversation[] = raw ? JSON.parse(raw) : [];
    if (list.length > 0) return list;
  } catch (error) {
    console.error("Failed to load chats:", error);
  }
  return [makeConversation()];
}

export function useChat() {
  const [conversations, setConversations] =
    useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState(() => conversations[0].id);
  const [persona, setPersona] = useState(
    () => localStorage.getItem(PERSONA_KEY) ?? "default",
  );
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(PERSONA_KEY, persona);
  }, [persona]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [conversations, activeId],
  );

  function setMessagesFor(id: string, messages: Message[], title?: string) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, messages, title: title ?? c.title, updatedAt: Date.now() }
          : c,
      ),
    );
  }

  async function stream(id: string, history: Message[], title?: string) {
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setMessagesFor(id, [...history, { role: "assistant", content: "" }], title);

    let reply = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, persona }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setMessagesFor(id, [
          ...history,
          {
            role: "assistant",
            content:
              data?.reply || "The AI could not respond. Please try again.",
          },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessagesFor(id, [...history, { role: "assistant", content: reply }]);
      }
      if (!reply) {
        setMessagesFor(id, [
          ...history,
          { role: "assistant", content: "No response" },
        ]);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        if (!reply) setMessagesFor(id, history);
      } else {
        setMessagesFor(id, [
          ...history,
          {
            role: "assistant",
            content: reply || "Could not reach the server. Please try again.",
          },
        ]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function send(text: string) {
    const t = text.trim();
    if (!t || loading || !active) return;
    const history: Message[] = [
      ...active.messages,
      { role: "user", content: t },
    ];
    const title = active.messages.length === 0 ? t.slice(0, 40) : undefined;
    stream(active.id, history, title);
  }

  function stop() {
    abortRef.current?.abort();
  }

  function regenerate() {
    if (loading || !active) return;
    const history = [...active.messages];
    while (history.length && history[history.length - 1].role === "assistant") {
      history.pop();
    }
    if (history.length === 0) return;
    stream(active.id, history);
  }

  function newChat() {
    abortRef.current?.abort();
    const empty = conversations.find((c) => c.messages.length === 0);
    if (empty) {
      setActiveId(empty.id);
      return;
    }
    const c = makeConversation();
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
  }

  function selectChat(id: string) {
    abortRef.current?.abort();
    setActiveId(id);
  }

  function deleteChat(id: string) {
    if (id === activeId) abortRef.current?.abort();
    const rest = conversations.filter((c) => c.id !== id);
    if (rest.length === 0) {
      const c = makeConversation();
      setConversations([c]);
      setActiveId(c.id);
      return;
    }
    setConversations(rest);
    if (id === activeId) setActiveId(rest[0].id);
  }

  return {
    conversations,
    active,
    activeId,
    persona,
    setPersona,
    loading,
    send,
    stop,
    regenerate,
    newChat,
    selectChat,
    deleteChat,
  };
}
