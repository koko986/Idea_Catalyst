"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { money } from "@/lib/data";

export function BuyPanel({ price, trial }: { price: number; trial: boolean }) {
  const [mode, setMode] = useState(trial ? "trial" : "standard");
  const [notice, setNotice] = useState("");
  return (
    <div className="card sidebar">
      <div className="price">{money(price)}</div>
      <p className="muted" style={{marginTop:8}}>Balance available: {money(4200000)}</p>
      <div className="trust-banner"><ShieldCheck size={24}/><div><strong>Escrow protected</strong><div className="muted" style={{fontSize:12}}>Released only after both confirm</div></div></div>
      {trial && <div className="field" style={{marginTop:16}}>
        <label>Protection mode</label>
        <select className="input" value={mode} onChange={(e)=>setMode(e.target.value)}>
          <option value="trial">48-hour try-before-finalizing</option>
          <option value="standard">24-hour standard inspection</option>
        </select>
      </div>}
      <button className="btn btn-primary" style={{width:"100%",marginTop:16}} onClick={()=>setNotice(`${money(price)} reserved securely. Checkout RT-NEW is ready.`)}>Secure in escrow</button>
      <Link href="/chat" className="btn btn-quiet" style={{width:"100%",marginTop:8}}>Message seller</Link>
      {notice && <div className="badge" style={{marginTop:14,borderRadius:10}}><BadgeCheck size={15}/>{notice}</div>}
      <p className="muted" style={{fontSize:12,lineHeight:1.5,margin:"16px 0 0"}}>A missing confirmation opens review. ReTrust never silently releases your funds.</p>
    </div>
  );
}
