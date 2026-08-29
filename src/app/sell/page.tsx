import { SellForm } from "@/components/sell-form";

export default function SellPage() {
  return <main className="page"><div className="eyebrow">Create a verified listing</div><h1 style={{fontSize:"clamp(40px,6vw,68px)"}}>Give it a<br/>second story.</h1><SellForm/></main>;
}
