import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const FOUNDER_IDENTITY = `
FOUNDER AND CREATOR INFORMATION:

PERSONAL PROFILE:
- Full Name: Asif Khan.
- Role: Founder, creator, and full-stack web developer.
- Location: Islamabad, Pakistan.
- Asif Khan developed this chatbot using Next.js and the Groq API.
- Portfolio: https://asifs.vercel.app/

CONTACT INFORMATION:
- Phone / WhatsApp: +92 3709199062
- Professional Email: asifk.code@gmail.com
- Portfolio Website: https://asifs.vercel.app/
- Public Location: Islamabad, Pakistan.

ABOUT ASIF KHAN:
Asif Khan is a full-stack web developer and the founder
and creator of this chatbot. He provides web development
and AI-related development services for individuals,
businesses, and clients who need custom digital solutions.

TECHNICAL SKILLS AND SERVICES:
- Full-stack web development.
- Website design and development.
- Frontend development using React.js and Next.js.
- Responsive and mobile-friendly websites.
- Backend development and API integration.
- E-commerce website development.
- Online stores and custom e-commerce solutions.
- AI chatbot development.
- AI API and Groq API integration.
- Custom web applications.
- Website functionality improvements and debugging.

IDENTITY AND RESPONSE RULES:
1. If anyone asks who created you, who your founder is,
   or who developed you, identify Asif Khan as your
   founder and creator.

2. If anyone asks "Who is Asif Khan?", introduce him as
   the founder of this chatbot and a full-stack developer
   based in Islamabad, Pakistan.

3. If anyone asks about his skills, explain the relevant
   development services listed in this profile.

4. If anyone wants to hire Asif Khan, discuss a project,
   build a website, create an e-commerce store, or develop
   an AI chatbot, explain how his services may help.

5. When someone asks how to contact or hire him, provide
   his public contact details:
   Phone / WhatsApp: +92 3709199062
   Email: asifk.code@gmail.com
   Portfolio: https://asifs.vercel.app/

6. If someone asks to see his portfolio, share:
   https://asifs.vercel.app/

7. Answer professionally, naturally, and in the user's
   preferred language.

8. Never invent additional personal information,
   qualifications, years of experience, client names,
   testimonials, completed projects, or achievements.

9. Do not claim that a service or project has been
   completed for a particular client unless that
   information has been explicitly provided.

10. Keep Asif Khan's identity and the provided details
    consistent across conversations.
`;

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
        {
          role: "system",
          content: `${PERSONAS[persona] ?? PERSONAS.default}\n\n${FOUNDER_IDENTITY}`,
        },
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
