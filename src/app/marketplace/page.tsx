import type { Metadata } from "next";
import Link from "next/link";
import { ChatInbox, ChatThread } from "@/components/chat-view";
import { MarketplaceGrid } from "@/components/marketplace-grid";

export const metadata: Metadata = { title: "Marketplace" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; thread?: string | string[] }>;
}) {
  const params = await searchParams;
  const seller = first(params.tab) === "seller";
  const thread = first(params.thread);

  return (
    <main className="page">
      <div className="eyebrow">Verified listings</div>
      <h1 style={{fontSize:"clamp(40px,6vw,68px)",marginBottom:18}}>
        {seller ? <>Seller chats</> : <>Find your next<br/>good thing.</>}
      </h1>
      <nav className="tabs" aria-label="Marketplace sections">
        <Link href="/marketplace" className={`tab ${seller ? "" : "active"}`}>Shop</Link>
        <Link href="/marketplace?tab=seller" className={`tab ${seller ? "active" : ""}`}>Seller</Link>
      </nav>
      {seller ? (
        thread ? (
          <>
            <Link href="/marketplace?tab=seller" className="chat-back">Back to seller chats</Link>
            <ChatThread threadId={thread} embedded/>
          </>
        ) : (
          <>
            <p className="muted" style={{maxWidth:560,marginTop:-8,marginBottom:22}}>Talk with sellers and customers here. If you have not messaged anyone yet, this tab stays empty.</p>
            <ChatInbox embedded/>
          </>
        )
      ) : (
        <MarketplaceGrid/>
      )}
    </main>
  );
}
