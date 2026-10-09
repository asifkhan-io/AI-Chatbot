"use client";

import { isValidElement, useRef, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import type { Message } from "@/lib/types";

function CodeBlock({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const codeProps = isValidElement(children)
    ? (children.props as { className?: string })
    : undefined;
  const lang = codeProps?.className?.match(/language-([\w-]+)/)?.[1] ?? "code";

  async function copy() {
    try {
      await navigator.clipboard.writeText(ref.current?.innerText ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className='code-block'>
      <div className='code-header'>
        <span>{lang}</span>
        <button className='code-copy' onClick={copy}>
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

const mdComponents: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  a: ({ href, children }) => (
    <a href={href} target='_blank' rel='noreferrer'>
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className='table-wrap'>
      <table>{children}</table>
    </div>
  ),
};

type Props = {
  message: Message;
  streaming: boolean;
  showRegenerate: boolean;
  onRegenerate: () => void;
};

export default function MessageBubble({
  message,
  streaming,
  showRegenerate,
  onRegenerate,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (message.role === "user") {
    return (
      <div className='msg user'>
        <div className='user-bubble'>{message.content}</div>
      </div>
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className='msg'>
      <div className='avatar'>AI</div>
      <div className='msg-body'>
        {message.content ? (
          <div className='markdown assistant-text'>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={mdComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className='typing'>
            <span />
            <span />
            <span />
          </div>
        )}

        {message.content && !streaming && (
          <div className='actions'>
            <button className='action-btn' onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </button>
            {showRegenerate && (
              <button className='action-btn' onClick={onRegenerate}>
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
