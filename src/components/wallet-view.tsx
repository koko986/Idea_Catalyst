"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Leaf, LockKeyhole, Plus } from "lucide-react";
import { money } from "@/lib/data";

const initial = [
  ["Escrow hold · RT-2048", -1480000, "Today · protected"],
  ["Admin-assisted top-up · TP-8812", 3000000, "Aug 27 · reference verified"],
  ["Sale released · RT-1987", 620000, "Aug 22 · dual confirmed"],
  ["Refund · RT-1931", 280000, "Aug 18 · dispute resolved"],
];

export function WalletView() {
  const [requested,setRequested] = useState(false);
  return (
    <div className="split">
      <div>
        <div className="wallet-card">
          <div className="meta-row" style={{color:"rgba(255,255,255,.7)"}}><span>AVAILABLE BALANCE</span><LockKeyhole size={18}/></div>
          <div className="metric" style={{margin:"18px 0 3px"}}>{money(4200000)}</div>
          <div style={{opacity:.7}}>1,480,000 MMK held separately in escrow</div>
          <div className="actions"><button className="btn btn-lime" onClick={()=>setRequested(true)}><Plus size={17}/> Request top-up</button><button className="btn" style={{background:"rgba(255,255,255,.12)",color:"white"}}>View statement</button></div>
        </div>
        {requested && <div className="card" style={{marginTop:16}}><h3>Top-up request created</h3><p className="muted">Reference TP-NEW is waiting for an admin to verify payment evidence. Your balance will not change until a balanced journal entry is posted.</p><span className="badge badge-warn">Pending review</span></div>}
        <section className="section">
          <div className="section-head"><h2>Activity</h2><button className="btn btn-quiet">Export CSV</button></div>
          <div className="card" style={{padding:4}}>
            {initial.map(([label,amount,note])=><div key={String(label)} style={{display:"grid",gridTemplateColumns:"42px 1fr auto",gap:12,alignItems:"center",padding:15,borderBottom:"1px solid var(--line)"}}>
              <div className="iconbox">{Number(amount)>0?<ArrowDownLeft size={18}/>:<ArrowUpRight size={18}/>}</div>
              <div><strong>{String(label)}</strong><div className="muted" style={{fontSize:12,marginTop:4}}>{String(note)}</div></div>
              <strong style={{color:Number(amount)>0?"var(--brand)":"var(--ink)"}}>{Number(amount)>0?"+":""}{money(Number(amount))}</strong>
            </div>)}
          </div>
        </section>
      </div>
      <aside className="sidebar">
        <div className="card"><div className="eyebrow">Eco-Points</div><div className="metric" style={{marginTop:12}}>1,840</div><p className="muted">Non-cashable rewards from 213 kg of reuse impact.</p><a href="/rewards" className="btn btn-primary" style={{width:"100%"}}><Leaf size={17}/> Explore rewards</a></div>
        <div className="card" style={{marginTop:16}}><h3>Ledger protection</h3><p className="muted">Entries are append-only, balanced and idempotent. Corrections use reversals, never hidden edits.</p></div>
      </aside>
    </div>
  );
}
