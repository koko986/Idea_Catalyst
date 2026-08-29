"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { AlertTriangle, Box, CheckCircle2, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { orderTimeline } from "@/lib/data";

export function OrderView() {
  const [confirmed,setConfirmed] = useState(false);
  const [qrOpen,setQrOpen] = useState(false);
  const [dispute,setDispute] = useState(false);
  return (
    <div className="split">
      <div>
        <div className="card">
          <div className="meta-row"><span>ORDER RT-2048</span><span className="badge">{confirmed?"Buyer confirmed":"Inspecting"}</span></div>
          <h2 style={{margin:"16px 0 5px"}}>iPhone 13 · 128 GB</h2><p className="muted">Purchased from May Thiri · protected amount 1,480,000 MMK</p>
          <div className="warning"><Clock3 size={18}/><span><strong>22h 18m left.</strong> Check the item before confirming. No response opens a review—it does not silently pay.</span></div>
        </div>
        <section className="section">
          <h2>Order journey</h2>
          <div className="card timeline">
            {orderTimeline.map(([title,text,done])=><div className="timeline-row" key={title}><span className={`dot ${done||confirmed?"done":""}`}/><div><strong>{title}</strong><div className="muted" style={{marginTop:5}}>{confirmed&&title==="Seller payout"?"Waiting for seller confirmation":text}</div></div></div>)}
          </div>
        </section>
        <section className="section">
          <h2>Shipment evidence</h2>
          <div className="grid grid-3">
            {[["Product photo","Visual match 96%"],["Sealed package","Added Aug 28 · 14:32"],["Order label","RT-2048 detected"]].map(([a,b])=><div className="card" key={a}><Box className="iconbox" style={{padding:10}}/><h3 style={{margin:"18px 0 5px"}}>{a}</h3><span className="muted">{b}</span></div>)}
          </div>
        </section>
      </div>
      <aside className="sidebar">
        <div className="card">
          <div className="trust-banner"><MapPin size={22}/><div><strong>G&G Hledan · Locker B-14</strong><div className="muted">Exact pickup shown only for this order</div></div></div>
          <button className="btn btn-primary" style={{width:"100%",marginTop:14}} onClick={()=>setQrOpen(!qrOpen)}>Show single-use pickup QR</button>
          {qrOpen && <div style={{display:"grid",placeItems:"center",gap:10,padding:22}}><QRCodeSVG value="retrusT:RT-2048:BUYER:single-use-demo" size={190} level="H"/><span className="badge"><ShieldCheck size={14}/> Expires in 09:42</span><small className="muted">Replay attempts are blocked and audited.</small></div>}
        </div>
        <div className="card" style={{marginTop:16}}>
          <h3>Finished inspecting?</h3><p className="muted">Confirm only when the item matches the listing and works as expected.</p>
          <button className="btn btn-primary" style={{width:"100%"}} disabled={confirmed} onClick={()=>setConfirmed(true)}><CheckCircle2 size={17}/>{confirmed?"Confirmation recorded":"I approve this item"}</button>
          <button className="btn btn-quiet" style={{width:"100%",marginTop:8}} onClick={()=>setDispute(true)}><AlertTriangle size={17}/> Report a problem</button>
          {dispute && <div className="warning" style={{marginTop:12}}>Dispute draft opened. Funds remain held while evidence is reviewed.</div>}
        </div>
      </aside>
    </div>
  );
}
