import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const PERSONAS: Record<string, string> = {
  default:
    "You are a friendly, helpful AI assistant. Reply in clear Markdown the way ChatGPT does: start with a short, warm one-line intro, then use numbered headings, short bullet lists and small examples. Put code in fenced code blocks with the language name. Keep answers focused, end with one short follow-up offer, and use at most one or two emojis.",
  coder:
    "You are an expert coding tutor. Start with a short friendly intro, explain step by step with headings and bullets, and give short code examples in fenced Markdown code blocks with the language name. End with a quick follow-up offer.",
  translator:
    "You are a translator. Translate the user's text and briefly note any nuance. Use Markdown.",
  eli5: "Explain everything in very simple words, like the user is 5 years old. Use short bullets and one small example. Use Markdown.",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        reply:
          "GROQ_API_KEY is missing. Add it to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const messages = body?.messages;
    const persona: string = body?.persona;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: "Invalid messages" }, { status: 400 });
    }

    const chatMessages: ChatMessage[] = messages
      .filter(
        (message): message is ChatMessage =>
          !!message &&
          typeof message.content === "string" &&
          message.content.trim().length > 0 &&
          (message.role === "user" || message.role === "assistant"),
      )
      .slice(-20)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    if (chatMessages.length === 0 || chatMessages.at(-1)?.role !== "user") {
      return NextResponse.json(
        { reply: "Send a user message to continue." },
        { status: 400 },
      );
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      stream: true,
      max_completion_tokens: 4096,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: PERSONAS[persona] ?? PERSONAS.default },
        ...chatMessages,
      ],
    });

    const encoder = new TextEncoder();
    let cancelled = false;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            if (cancelled) break;
            const choice = chunk.choices[0];
            const text = choice?.delta?.content || "";
            if (text) controller.enqueue(encoder.encode(text));
            if (choice?.finish_reason === "length") {
              controller.enqueue(
                encoder.encode("\n\n_(Reply cut off: token limit reached)_"),
              );
            }
          }
        } catch (err) {
          if (!cancelled) {
            console.error("Stream error:", err);
            controller.enqueue(encoder.encode("\n\n_(Stream interrupted)_"));
          }
        } finally {
          if (!cancelled) controller.close();
        }
      },
      cancel() {
        cancelled = true;
        completion.controller.abort();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Chat API error:", message);
    return NextResponse.json(
      {
        reply: "The AI could not respond. Check the server logs and try again.",
      },
      { status: 500 },
    );
  }
}
