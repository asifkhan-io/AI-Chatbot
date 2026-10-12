"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";

type Props = {
  loading: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
};

export default function ChatInput({ loading, onSend, onStop }: Props) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<any>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  function submit() {
    if (!value.trim() || loading) return;
    onSend(value);
    setValue("");
  }

  function toggleVoice() {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input is not supported in this browser. Try Chrome.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setValue((prev) => (prev ? prev + " " : "") + transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <div className='input-wrap'>
      <div className='input-box'>
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={listening ? "Listening..." : "Message AI Chatbot..."}
        />

        <button
          className={`icon-btn ${listening ? "mic-on" : ""}`}
          onClick={toggleVoice}
          aria-label='Voice input'
          title='Voice input (Chrome)'
        >
          <svg
            width='18'
            height='18'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <rect x='9' y='2' width='6' height='12' rx='3' />
            <path d='M5 10v1a7 7 0 0 0 14 0v-1' />
            <line x1='12' y1='18' x2='12' y2='22' />
          </svg>
        </button>

        {loading ? (
          <button
            className='icon-btn send-btn'
            onClick={onStop}
            aria-label='Stop'
          >
            <span className='stop-square' />
          </button>
        ) : (
          <button
            className='icon-btn send-btn'
            onClick={submit}
            disabled={!value.trim()}
            aria-label='Send'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <line x1='12' y1='19' x2='12' y2='5' />
              <polyline points='5,12 12,5 19,12' />
            </svg>
          </button>
        )}
      </div>
      <p className='hint'> AI can make mistakes · Developed by Asif Khan</p>
    </div>
  );
}
