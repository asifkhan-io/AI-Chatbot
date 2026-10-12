# AI Chatbot

A ChatGPT-style AI chatbot built with **Next.js** and the **Groq API**, with streaming replies, saved chats and a clean, responsive interface.

🔗 **Live demo:** [asif-chatbot.vercel.app](https://asif-chatbot.vercel.app/)
👤 **Portfolio:** [asifs.vercel.app](https://asifs.vercel.app/)

## Features

- ⚡ Real-time streaming responses
- 📝 Markdown rendering with syntax-highlighted code blocks and a copy button
- 💬 Multiple chats in a sidebar, saved in the browser (localStorage)
- 🎭 Personas: default, coding tutor, translator, explain like I'm 5
- 🎤 Voice input (Chrome)
- ⏹️ Stop, regenerate and copy actions on replies
- 🌗 Dark and light theme
- 📱 Fully responsive, with a mobile sidebar menu

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router) and React
- TypeScript
- [Groq API](https://groq.com/) (`openai/gpt-oss-120b`)
- react-markdown, remark-gfm, rehype-highlight
- Deployed on Vercel

## Getting Started

1. Clone the repository and install dependencies:

```bash
   git clone https://github.com/YOUR-USERNAME/AI-Chatbot.git
   cd AI-Chatbot
   npm install
```

2. Create a `.env.local` file in the project root:

```env
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=openai/gpt-oss-120b
```

Get a free API key from the [Groq Console](https://console.groq.com/).

3. Start the development server:

```bash
   npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  api/chat/route.ts   # Streaming Groq API route
  page.tsx            # Loads the chat app on the client
components/           # Sidebar, MessageBubble, ChatInput, EmptyState, ChatApp
hooks/useChat.ts      # Chat state, streaming and history
lib/                  # Types and personas
```

## Author

**Asif Khan** — Frontend Developer (React & Next.js)
Portfolio: [asifs.vercel.app](https://asifs.vercel.app/)
