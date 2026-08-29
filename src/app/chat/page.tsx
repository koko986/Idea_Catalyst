import { ChatView } from "@/components/chat-view";

export default function ChatPage() {
  return <main className="page"><div className="eyebrow">Protected chat</div><h1 style={{fontSize:"clamp(40px,6vw,68px)"}}>Talk freely.<br/>Deal safely.</h1><ChatView/></main>;
}
