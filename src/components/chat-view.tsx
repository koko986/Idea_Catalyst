"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AlertTriangle, ChevronLeft, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { useConversations } from "@/components/use-conversations";
import { draftThread, formatChatTime, lastPreview, persistConversations, sendMessage } from "@/lib/chat";

export function ChatInbox() {
  const conversations = useConversations();
  return (
    <main className="page">
      <div className="eyebrow">Inbox</div>
      <h1 style={{fontSize:"clamp(40px,6vw,68px)",marginBottom:8}}>Chats</h1>
      <p className="muted" style={{maxWidth:520,marginBottom:28}}>Your conversations with sellers and buyers stay here so you can pick them up again anytime.</p>
      {conversations.length === 0 ? (
        <section className="card inbox-empty">
          <div className="iconbox" style={{margin:"0 auto 16px"}}><MessageCircle size={22}/></div>
          <h2 style={{fontSize:28,marginBottom:8}}>No chats yet</h2>
          <p className="muted" style={{maxWidth:420,margin:"0 auto"}}>When you message a seller from a listing or a customer from an offer, that conversation will appear here.</p>
        </section>
      ) : (
        <section className="card inbox" aria-label="Chat history">
          {conversations.map((conversation) => (
            <Link className="inbox-row" key={conversation.id} href={`/chat/${conversation.id}`}>
              <span className="avatar">{conversation.peerInitials}</span>
              <span>
                <strong>{conversation.peerName}</strong>
                <span className="muted" style={{display:"block",marginTop:3}}>{conversation.listingTitle}</span>
                <span className="muted" style={{display:"block",marginTop:6}}>{lastPreview(conversation)}</span>
              </span>
              <span className="muted" style={{fontSize:12,fontWeight:700}}>{formatChatTime(conversation.updatedAt)}</span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

export function ChatThread({ threadId }: { threadId: string }) {
  const items = useConversations();
  const stored = items.find((item) => item.id === threadId);
  const conversation = stored ?? draftThread(threadId);
  const [text, setText] = useState("");
  const [warning, setWarning] = useState("");

  function send(event: FormEvent) {
    event.preventDefault();
    if (!conversation) return;
    const result = sendMessage(items, conversation, text);
    if (result.conversation.messages.length !== conversation.messages.length) {
      persistConversations(result.items);
    }
    setWarning(result.warning);
    setText("");
  }

  if (!conversation) {
    return (
      <main className="page">
        <Link href="/chat" className="chat-back"><ChevronLeft size={18}/> Back to chats</Link>
        <section className="card inbox-empty">
          <h2 style={{fontSize:28,marginBottom:8}}>Conversation not found</h2>
          <p className="muted">This chat is no longer available.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <Link href="/chat" className="chat-back"><ChevronLeft size={18}/> Chats</Link>
      <div className="chat-head">
        <span className="avatar" style={{width:46,height:46}}>{conversation.peerInitials}</span>
        <div>
          <div className="eyebrow">Protected chat</div>
          <h1 style={{fontSize:"clamp(32px,5vw,52px)",margin:"4px 0 0"}}>{conversation.peerName}</h1>
          <p className="muted" style={{margin:"6px 0 0"}}>{conversation.listingTitle}</p>
        </div>
      </div>
      <div className="split">
        <section className="card chat">
          <div className="messages">
            <div className="trust-banner">
              <ShieldCheck size={20}/>
              <div>
                <strong>Protected conversation</strong>
                <div className="muted">{conversation.peerName}{conversation.verified ? " · identity + phone verified" : ""}</div>
              </div>
            </div>
            {conversation.messages.length === 0 && (
              <p className="muted" style={{textAlign:"center",padding:"28px 8px"}}>No messages yet. Say hello and this chat will stay in your inbox.</p>
            )}
            {conversation.messages.map((message) => (
              <div key={message.id} className={`bubble ${message.mine ? "mine" : ""}`} style={message.blocked ? {background:"var(--danger)"} : undefined}>
                {message.text}
              </div>
            ))}
            {warning && (
              <div className="warning">
                <AlertTriangle size={18}/>
                <span><strong>Message blocked.</strong> {warning}. Keep payment and contact inside PyanThit.</span>
              </div>
            )}
          </div>
          <form onSubmit={send} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,paddingTop:12,borderTop:"1px solid var(--line)"}}>
            <input className="input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Message safely…"/>
            <button className="btn btn-primary" aria-label="Send message"><Send size={18}/></button>
          </form>
        </section>
        <aside className="card sidebar">
          <div className="eyebrow">Chat guard</div>
          <h3 style={{fontSize:25,marginTop:10}}>Stay inside the protected deal.</h3>
          <p className="muted">Links, phone numbers, wallet account requests and common off-platform phrases are blocked before sending. Ambiguous messages can be queued for AI-assisted moderation.</p>
          <div className="warning"><AlertTriangle size={18}/><span>Try entering “send to my KPay number” to test the safety filter.</span></div>
        </aside>
      </div>
    </main>
  );
}
