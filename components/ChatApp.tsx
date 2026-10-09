"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { PERSONAS } from "@/lib/personas";
import type { Message } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";
import EmptyState from "@/components/EmptyState";

const EMPTY: Message[] = [];

export default function ChatApp() {
  const chat = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    localStorage.getItem("theme") === "light" ? "light" : "dark",
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = chat.active?.messages ?? EMPTY;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: chat.loading ? "auto" : "smooth",
    });
  }, [messages, chat.loading]);

  return (
    <div className='app'>
      <Sidebar
        conversations={chat.conversations}
        activeId={chat.activeId}
        open={sidebarOpen}
        onSelect={(id) => {
          chat.selectChat(id);
          setSidebarOpen(false);
        }}
        onNew={() => {
          chat.newChat();
          setSidebarOpen(false);
        }}
        onDelete={chat.deleteChat}
        onClose={() => setSidebarOpen(false)}
      />

      <main className='main'>
        <header className='header'>
          <button
            className='icon-btn menu-btn'
            onClick={() => setSidebarOpen(true)}
            aria-label='Open menu'
          >
            ☰
          </button>
          <span className='header-title'>AI Chatbot</span>
          <div className='spacer' />
          <select
            className='select'
            value={chat.persona}
            onChange={(e) => chat.setPersona(e.target.value)}
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            className='icon-btn'
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label='Toggle theme'
            title='Toggle theme'
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </header>

        <div className='messages'>
          <div className='messages-inner'>
            {messages.length === 0 ? (
              <EmptyState onPick={chat.send} />
            ) : (
              messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  message={m}
                  streaming={chat.loading && i === messages.length - 1}
                  showRegenerate={i === messages.length - 1 && !chat.loading}
                  onRegenerate={chat.regenerate}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <ChatInput
          loading={chat.loading}
          onSend={chat.send}
          onStop={chat.stop}
        />
      </main>
    </div>
  );
}
