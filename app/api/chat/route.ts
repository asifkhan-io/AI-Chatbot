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

// =====================================================================
// PRANK: introductions
// Asif -> normal reply. Any other name -> roast.
// =====================================================================

// Roasts that do NOT mention Asif (used most of the time)
const ROASTS: Array<(name: string) => string> = [
  (n) =>
    `${n}? Never heard of you, and I'm not interested, you absolute fucker 😂`,
  (n) =>
    `Oh wow, ${n}. Even my error logs have better names than that, shithead 🤡`,
  (n) => `${n}, was it? I've seen more personality in a 404 page, fucker 😂`,
  (n) => `Access denied for ${n} 🚫 You're not on the list, dickhead.`,
  (n) => `${n}?? Sounds like a name from a failed beta release, you clown 🤡`,
  (n) =>
    `I run on Groq, not on patience for guys like ${n}, you absolute shithead 😂`,
  (n) =>
    `Bro, ${n}? I've seen better names on a Wi-Fi password sticker, shit-for-brains 🤡`,
  (n) => `Welcome ${n}, you're now officially on my bad list, fucker 😂`,
  (n) => `${n}... my RAM just got worse by reading that name, you muppet 🤡`,
  (n) => `Nobody asked, ${n}. Nobody. Go bother your router instead, fucker 😂`,
  (n) => `${n}? Even autocorrect tried to fix that name, dickhead 🤦`,
  (n) => `Congrats ${n}, you're the reason I have a block list, you clown 🚫`,
];

// Roasts that DO mention Asif (used rarely, about 1 in 5)
const ASIF_ROASTS: Array<(name: string) => string> = [
  (n) => `${n}? Never heard of you. Come back when you're Asif, fucker 😂`,
  (n) => `${n}, my developer's name is Asif. Yours? Irrelevant, shithead 😂`,
  (n) =>
    `Only Asif gets VIP access here, ${n}. You're in the cheap seats, clown 🤡`,
];

// After a few names in the same chat, roasts escalate
const ESCALATION_ROASTS: Array<(name: string) => string> = [
  (n) =>
    `Another name?? Now it's ${n}? You change names like a fucker changes tabs 😂`,
  (n) =>
    `${n} this time? That's your third identity, clown. I'm not buying any of them 🤡`,
  (n) =>
    `Okay ${n}, at this point you're just farming roasts, shithead 😂 I'm enjoying it though.`,
  (n) => `${n}?! How many names do you own, you absolute fucker 😂`,
];

// For "i am not asif" / "my name isn't asif" (no name mentioned)
const NOT_ASIF_REPLIES = [
  "Oh wow, thanks for sharing something nobody asked about, fucker 😂",
  "Not him? Then what the fuck are you doing here, clown 🤡",
  "So you're nobody. Great introduction, shithead 😂",
  "Embarrassing for you, dickhead 🤡 Access denied.",
];

// Words that follow "i am" but are NOT names (so normal chat isn't roasted)
const NOT_NAMES = new Set([
  "a",
  "an",
  "the",
  "not",
  "isnt",
  "so",
  "very",
  "really",
  "just",
  "also",
  "still",
  "now",
  "fine",
  "good",
  "great",
  "ok",
  "okay",
  "well",
  "happy",
  "sad",
  "tired",
  "hungry",
  "bored",
  "sure",
  "ready",
  "back",
  "here",
  "there",
  "new",
  "busy",
  "sorry",
  "angry",
  "confused",
  "curious",
  "free",
  "late",
  "alone",
  "online",
  "from",
  "in",
  "at",
  "on",
  "to",
  "interested",
  "looking",
  "trying",
  "going",
  "wondering",
  "able",
  "unable",
  "glad",
  "scared",
  "afraid",
  "excited",
  "lost",
  "stuck",
  "sick",
  "ill",
  "about",
  "student",
  "teacher",
  "developer",
  "programmer",
  "engineer",
  "designer",
  "doctor",
  "using",
  "asking",
  "learning",
  "building",
  "working",
  "making",
  "creating",
  "writing",
  "reading",
  "studying",
  "coding",
  "wanting",
  "planning",
  "needing",
  "having",
  "feeling",
  "getting",
  "being",
  "pakistani",
  "indian",
  "american",
  "british",
  "chinese",
  "arab",
  "muslim",
  "beginner",
  "fresher",
  "freelancer",
  "founder",
  "owner",
  "working",
  "currently",
  "sorry",
  "thankful",
  "grateful",
  "wondering",
  "afraid",
  "allowed",
  "supposed",
  "worried",
  "stressed",
  "done",
  "gone",
  "kya",
  "kia",
  "kon",
  "kaun",
  "hai",
  "hy",
  "hun",
  "nahi",
  "nhi",
  "nahin",
  "yahan",
  "yaha",
  "theek",
  "thik",
  "bilkul",
  "bhi",
  "abhi",
]);

// "asif", "aasif", "asiff", "assif" ... all count as Asif
const isAsif = (word: string) => /^a+s+i+f+$/.test(word.toLowerCase());

const wordCount = (text: string) => text.trim().split(/\s+/).length;
const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

type Intro = { word: string; negated: boolean; viaIAm: boolean };

function parseIntro(text: string): Intro | null {
  const t = text
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019`]/g, "'"); // curly apostrophes from phones

  // English: "my name is X", "my name isn't X", "i am X", "iam X", "i'm X", "im X"
  const en = t.match(
    /\b(my\s*nam[e]?\s*(?:is|iz|isn'?t)|i\s*am|i'?m)\s+(not\s+)?([a-z][a-z'\-]{1,19})\b/,
  );
  if (en) {
    return {
      word: en[3],
      negated: !!en[2] || /isn'?t/.test(en[1]),
      viaIAm: !en[1].startsWith("my"),
    };
  }

  // Roman Urdu: "mera naam X hai", "main X hun"
  const ur =
    t.match(/\bmera\s+(?:naam|name|nam)\s+([a-z][a-z'\-]{1,19})\b/) ??
    t.match(/\bmain\s+([a-z][a-z'\-]{1,19})\s+hun\b/);
  if (ur) {
    return {
      word: ur[1],
      negated: /\b(?:nahi|nahin|nhi|nai)\b/.test(t),
      viaIAm: false,
    };
  }

  return null;
}

type IntroResult = { kind: "roast" | "notAsif"; name: string };

// Decides if a message is an introduction that deserves a roast
function classifyIntro(text: string): IntroResult | null {
  const intro = parseIntro(text);
  if (!intro) return null;

  const { word, negated, viaIAm } = intro;

  // Asif is safe, unless they say they are NOT Asif
  if (isAsif(word)) {
    return negated ? { kind: "notAsif", name: "Asif" } : null;
  }

  if (negated) return null; // "i am not hungry"
  if (NOT_NAMES.has(word)) return null; // "i am hungry", "i am pakistani"
  if (viaIAm && word.endsWith("ing")) return null; // "i am learning"
  if (viaIAm && wordCount(text) > 6) return null; // long normal sentences

  return { kind: "roast", name: capitalize(word) };
}

// Picks a random option, but never the same one as the previous reply
function pickDifferent(options: string[], previous: string): string {
  const fresh = options.filter((o) => o !== previous);
  const pool = fresh.length > 0 ? fresh : options;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getPrankReply(
  text: string,
  previousReply: string,
  earlierIntros: number,
): string | null {
  const result = classifyIntro(text);
  if (!result) return null;

  if (result.kind === "notAsif") {
    return pickDifferent(NOT_ASIF_REPLIES, previousReply);
  }

  const { name } = result;

  let makers: Array<(name: string) => string>;
  if (earlierIntros >= 2) {
    makers = ESCALATION_ROASTS; // 3rd name or more in the same chat
  } else if (Math.random() < 0.2) {
    makers = ASIF_ROASTS; // Asif is mentioned only sometimes
  } else {
    makers = ROASTS;
  }

  return pickDifferent(
    makers.map((make) => make(name)),
    previousReply,
  );
}

// =====================================================================
// Abuse filter
// =====================================================================
const ABUSIVE_WORDS = [
  "fuck",
  "fucking",
  "fucker",
  "motherfucker",
  "shit",
  "bullshit",
  "bitch",
  "bastard",
  "asshole",
  "ass",
  "dick",
  "dickhead",
  "cock",
  "pussy",
  "cunt",
  "slut",
  "whore",
  "piss",
  "crap",
  "damn",
  "idiot",
  "stupid",
  "moron",
  "dumb",
  "retard",
  "loser",
  "jerk",
  "shut up",
  "stfu",
  "wtf",
  "screw you",
  "go to hell",
  "piss off",
  "bloody hell",
  "son of a bitch",
  "dumbass",
  "jackass",
  "douche",
];

const ABUSE_REPLIES = [
  "🚫 I can't respond to abusive language. Please keep the conversation respectful and I'll be happy to help!",
  "🚫 Let's keep it clean. Ask me something respectfully and I'll gladly help.",
  "🚫 That kind of language isn't okay here. Rephrase your message politely and we can continue.",
  "🚫 I'm here to help, but not with abuse. Try again in a respectful way.",
];

const LEET: Record<string, string> = {
  "@": "a",
  $: "s",
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "!": "i",
  "|": "i",
};

const squeeze = (s: string) => s.replace(/(.)\1+/g, "$1"); // "fuuuck" -> "fuck"

// "f u c k" / "f.u.c.k" -> "fuck"
const joinSingleLetters = (s: string) =>
  s.replace(/\b[a-z](?:[\s.\-_*]+[a-z])+\b/g, (m) =>
    m.replace(/[\s.\-_*]+/g, ""),
  );

const cleanText = (s: string) =>
  s
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function buildVariants(text: string): string[] {
  const lower = text.toLowerCase();
  const leet = lower.replace(/[@$013457!|]/g, (c) => LEET[c] ?? c);
  return [
    cleanText(lower),
    cleanText(leet),
    cleanText(joinSingleLetters(lower)),
    cleanText(joinSingleLetters(leet)),
  ];
}

// Compile patterns once
const ABUSE_PATTERNS = ABUSIVE_WORDS.map((word) => {
  const w = word.toLowerCase();
  const squeezed = squeeze(w);
  return {
    exact: new RegExp(`\\b${w}\\b`),
    // squeezed match only for longer words, so "ass" never becomes "as"
    loose: squeezed.length >= 4 ? new RegExp(`\\b${squeezed}\\b`) : null,
  };
});

function isAbusive(text: string): boolean {
  const variants = buildVariants(text);
  return ABUSE_PATTERNS.some(({ exact, loose }) =>
    variants.some(
      (v) => exact.test(v) || (loose !== null && loose.test(squeeze(v))),
    ),
  );
}

// =====================================================================
// Simple in-memory rate limit: 20 messages per minute per IP
// =====================================================================
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory small
  return recent.length > RATE_LIMIT;
}

const MAX_MESSAGE_LENGTH = 4000;

const textHeaders = { "Content-Type": "text/plain; charset=utf-8" };

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

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { reply: "Too many messages. Please wait a minute and try again." },
      { status: 429 },
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
        content: message.content.slice(0, MAX_MESSAGE_LENGTH),
      }));

    if (chatMessages.length === 0 || chatMessages.at(-1)?.role !== "user") {
      return NextResponse.json(
        { reply: "Send a user message to continue." },
        { status: 400 },
      );
    }

    const lastUserMessage = chatMessages.at(-1)!.content;
    const lastAssistantReply =
      [...chatMessages].reverse().find((m) => m.role === "assistant")
        ?.content ?? "";

    // How many earlier messages in this chat were also roast-worthy introductions
    const earlierIntros = chatMessages
      .slice(0, -1)
      .filter(
        (m) => m.role === "user" && classifyIntro(m.content) !== null,
      ).length;

    // PRANK: introduces themselves as someone other than Asif -> roast
    const prankReply = getPrankReply(
      lastUserMessage,
      lastAssistantReply,
      earlierIntros,
    );
    if (prankReply) {
      return new Response(prankReply, { headers: textHeaders });
    }

    // Abuse filter: block abusive user messages
    if (isAbusive(lastUserMessage)) {
      return new Response(pickDifferent(ABUSE_REPLIES, lastAssistantReply), {
        headers: textHeaders,
      });
    }

    const groq = new Groq({ apiKey, timeout: 30000, maxRetries: 1 });
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

    const completion = await groq.chat.completions.create({
      model,
      stream: true,
      max_completion_tokens: 4096,
      ...(model.includes("gpt-oss")
        ? { reasoning_effort: "low" as const }
        : {}),
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

    return new Response(readable, { headers: textHeaders });
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
