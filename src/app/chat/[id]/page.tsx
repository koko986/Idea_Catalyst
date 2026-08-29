import type { Metadata } from "next";
import { ChatThread } from "@/components/chat-view";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChatThread threadId={id}/>;
}
