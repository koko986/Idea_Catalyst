import { redirect } from "next/navigation";
import { ChatThread } from "@/components/chat-view";
import { parseListingThreadId } from "@/lib/chat";

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingId = parseListingThreadId(id);
  if (listingId) redirect(`/marketplace/${listingId}?tab=seller`);
  return <ChatThread threadId={id} backHref="/marketplace?tab=seller" backLabel="Seller chats"/>;
}
