"use client";

import { useState } from "react";
import { Camera, CheckCircle2, ScanSearch, ShieldAlert } from "lucide-react";

export function SellForm() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("Phones");
  return (
    <div className="split">
      <section className="card">
        <div className="tabs">{["Item details","Evidence","Price & delivery"].map((label,index)=><button key={label} className={`tab ${step===index+1?"active":""}`} onClick={()=>setStep(index+1)}>{index+1}. {label}</button>)}</div>
        {step===1 && <>
          <div className="form-grid">
            <div className="field"><label>Listing title</label><input className="input" defaultValue="iPhone 13 · 128 GB"/></div>
            <div className="field"><label>Category</label><select className="input" value={category} onChange={(e)=>setCategory(e.target.value)}><option>Phones</option><option>Computers</option><option>Home</option><option>Sports</option></select></div>
            <div className="field"><label>Condition</label><select className="input"><option>Like new</option><option>Excellent</option><option>Good</option><option>Fair</option></select></div>
            <div className="field"><label>General area only</label><input className="input" defaultValue="Junction City"/><small className="muted">Shown as an imprecise 500 m radius.</small></div>
          </div>
          {category==="Phones" && <div className="field" style={{marginTop:16}}><label>IMEI (required)</label><input className="input" inputMode="numeric" placeholder="15-digit IMEI"/><small className="muted">We verify checksum, duplicates and registry adapter status. It is never shown publicly.</small></div>}
          <div className="field" style={{marginTop:16}}><label>Description</label><textarea className="input" rows={5} defaultValue="Carefully used and fully tested. Original accessories included."/></div>
        </>}
        {step===2 && <>
          <div className="upload"><Camera size={28}/><h3 style={{margin:"12px 0 6px"}}>Add clear item photos</h3><p className="muted">Front, back, sides, serial area and every known flaw.</p><button className="btn btn-quiet">Choose photos</button></div>
          <div className="grid grid-3" style={{marginTop:16}}>
            <div className="card"><ScanSearch size={20}/><h3 style={{marginTop:12}}>Condition AI</h3><p className="muted">Advisory visual report with confidence.</p></div>
            <div className="card"><ShieldAlert size={20}/><h3 style={{marginTop:12}}>Reuse check</h3><p className="muted">Perceptual match against local uploads.</p></div>
            <div className="card"><CheckCircle2 size={20}/><h3 style={{marginTop:12}}>Watermark</h3><p className="muted">Username and current date on derivatives.</p></div>
          </div>
        </>}
        {step===3 && <div className="form-grid">
          <div className="field"><label>Price (MMK)</label><input className="input" inputMode="numeric" defaultValue="1480000"/></div>
          <div className="field"><label>Estimated item weight</label><input className="input" defaultValue="0.32 kg"/></div>
          <div className="field"><label>Delivery</label><select className="input"><option>Partner drop-off or locker</option><option>Protected direct handover</option><option>Doorstep courier</option></select></div>
          <div className="field"><label>Trial policy</label><select className="input"><option>48-hour trial eligible</option><option>24-hour standard only</option></select></div>
        </div>}
        <div className="actions" style={{justifyContent:"space-between"}}>
          <button className="btn btn-quiet" disabled={step===1} onClick={()=>setStep(Math.max(1,step-1))}>Back</button>
          {step<3?<button className="btn btn-primary" onClick={()=>setStep(step+1)}>Continue</button>:<button className="btn btn-primary">Submit for review</button>}
        </div>
      </section>
      <aside className="card sidebar"><div className="eyebrow">Seller protection</div><h3 style={{fontSize:25,marginTop:10}}>Proof before every payout</h3><p className="muted">At shipping, you will add the product photo, sealed package photo, order ID and automatic timestamp.</p><div className="warning"><ShieldAlert size={18}/><span>Never accept payment in chat. Official funds appear in escrow before you ship.</span></div></aside>
    </div>
  );
}
