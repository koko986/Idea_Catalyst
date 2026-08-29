"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Send, ShieldCheck } from "lucide-react";
import { inspectChat } from "@/lib/domain";

type Message = { text:string; mine:boolean; blocked?:boolean };
const starter: Message[] = [
  {text:"Hi! Is the battery health still 91%?",mine:true},
  {text:"Yes, I added today’s battery screenshot to the listing evidence.",mine:false},
  {text:"Great. I’ll use the 48-hour protected trial.",mine:true},
];

export function ChatView() {
  const [messages,setMessages] = useState(starter);
  const [text,setText] = useState("");
  const [warning,setWarning] = useState("");
  function send(event:FormEvent) {
    event.preventDefault();
    if(!text.trim()) return;
    const result=inspectChat(text);
    if(!result.allowed){setWarning(result.reason ?? "Message blocked");setMessages([...messages,{text:"Blocked message · kept as a security event",mine:true,blocked:true}]);}
    else {setMessages([...messages,{text,mine:true}]);setWarning("");}
    setText("");
  }
  return (
    <div className="split">
      <section className="card chat">
        <div className="messages">
          <div className="trust-banner"><ShieldCheck size={20}/><div><strong>Protected conversation</strong><div className="muted">May Thiri · identity + phone verified</div></div></div>
          {messages.map((message,index)=><div key={index} className={`bubble ${message.mine?"mine":""}`} style={message.blocked?{background:"var(--danger)"}:{}}>{message.text}</div>)}
          {warning && <div className="warning"><AlertTriangle size={18}/><span><strong>Message blocked.</strong> {warning}. Keep payment and contact inside PyanThit.</span></div>}
        </div>
        <form onSubmit={send} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,paddingTop:12,borderTop:"1px solid var(--line)"}}>
          <input className="input" value={text} onChange={(e)=>setText(e.target.value)} placeholder="Message safely…"/>
          <button className="btn btn-primary" aria-label="Send message"><Send size={18}/></button>
        </form>
      </section>
      <aside className="card sidebar">
        <div className="eyebrow">Chat guard</div><h3 style={{fontSize:25,marginTop:10}}>Stay inside the protected deal.</h3>
        <p className="muted">Links, phone numbers, wallet account requests and common off-platform phrases are blocked before sending. Ambiguous messages can be queued for AI-assisted moderation.</p>
        <div className="warning"><AlertTriangle size={18}/><span>Try entering “send to my KPay number” to test the safety filter.</span></div>
      </aside>
    </div>
  );
}
