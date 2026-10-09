"use client";

import type { Conversation } from "@/lib/types";

type Props = {
  conversations: Conversation[];
  activeId: string;
  open: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export default function Sidebar({
  conversations,
  activeId,
  open,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: Props) {
  const visible = conversations
    .filter((c) => c.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      {open && <div className='backdrop' onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <button className='new-chat-btn' onClick={onNew}>
          + New chat
        </button>

        <div className='chat-list'>
          {visible.length === 0 && (
            <p className='sidebar-empty'>No chats yet</p>
          )}
          {visible.map((c) => (
            <div
              key={c.id}
              className={`chat-item ${c.id === activeId ? "active" : ""}`}
              onClick={() => onSelect(c.id)}
            >
              <span>{c.title}</span>
              <button
                className='chat-delete'
                aria-label='Delete chat'
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className='sidebar-footer'>Built with Next.js + Groq</div>
      </aside>
    </>
  );
}
