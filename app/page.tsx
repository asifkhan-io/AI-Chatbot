"use client";

import dynamic from "next/dynamic";

const ChatApp = dynamic(() => import("@/components/ChatApp"), {
  ssr: false,
  loading: () => <div className='app' />,
});

export default function Home() {
  return <ChatApp />;
}
