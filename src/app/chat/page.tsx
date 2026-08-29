import type { Metadata } from "next";
import { ChatInbox } from "@/components/chat-view";

export const metadata: Metadata = { title: "Chats" };

export default function ChatPage() {
  return <ChatInbox/>;
}
