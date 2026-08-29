"use client";

import { useState } from "react";
import { BadgeCheck, Camera, CheckCircle2, EyeOff, LockKeyhole, Phone, ShieldCheck, Sparkles } from "lucide-react";

export function TrustCenter() {
  const [status, setStatus] = useState<"verified"|"new">("verified");
  return (
    <div className="split">
      <div>
        <div className="grid grid-4">
          <div className="card"><div className="metric">35</div><div className="stat-label">Completed orders</div></div>
          <div className="card"><div className="metric">34</div><div className="stat-label">Successful payments</div></div>
          <div className="card"><div className="metric">3%</div><div className="stat-label">Cancellation rate</div></div>
          <div className="card"><div className="metric">4.9</div><div className="stat-label">Community rating</div></div>
        </div>
        <section className="section">
          <div className="section-head"><div><div className="eyebrow">Verification</div><h2>Your trust signals</h2></div></div>
          <div className="grid">
            <div className="card" style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"center"}}><div style={{display:"flex",gap:13}}><Phone className="iconbox" style={{padding:10}}/><div><strong>Phone verified</strong><p className="muted" style={{margin:"5px 0 0"}}>+95 ••• ••• 612 · bound with OTP</p></div></div><span className="badge"><CheckCircle2 size={14}/> Active</span></div>
            <div className="card" style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"center"}}><div style={{display:"flex",gap:13}}><ShieldCheck className="iconbox" style={{padding:10}}/><div><strong>Identity verified</strong><p className="muted" style={{margin:"5px 0 0"}}>NRC ••••••••348 · reviewed Aug 12</p></div></div><span className="badge"><BadgeCheck size={14}/> Approved</span></div>
            <div className="card" style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"center"}}><div style={{display:"flex",gap:13}}><Sparkles className="iconbox" style={{padding:10}}/><div><strong>Power buyer</strong><p className="muted" style={{margin:"5px 0 0"}}>Earned from payment and completion history</p></div></div><span className="badge">Rule-earned</span></div>
          </div>
        </section>
        <section className="section">
          <h2>NRC verification case</h2>
          {status==="verified" ? <div className="card"><div className="trust-banner"><BadgeCheck size={26}/><div><strong>Human review complete</strong><div className="muted">AI photo quality 98% · text consistency 96% · approved by KY-04</div></div></div><button className="btn btn-quiet" style={{marginTop:16}} onClick={()=>setStatus("new")}>Preview renewal flow</button></div> :
          <div className="card"><div className="form-grid"><div className="upload"><Camera size={26}/><strong> NRC front</strong><p className="muted">Private upload</p></div><div className="upload"><Camera size={26}/><strong> Selfie check</strong><p className="muted">Live photo recommended</p></div></div><div className="field" style={{marginTop:16}}><label>Full legal name</label><input className="input" placeholder="As shown on NRC"/></div><button className="btn btn-primary" style={{marginTop:16}} onClick={()=>setStatus("verified")}>Submit for assisted review</button></div>}
        </section>
      </div>
      <aside className="card sidebar">
        <div className="eyebrow">Privacy by default</div><h3 style={{fontSize:25,marginTop:10}}>Your NRC is not your password.</h3>
        <p className="muted">You sign in with a one-time code. NRC evidence is encrypted, private and opened only through expiring admin access.</p>
        <div className="grid">
          <div style={{display:"flex",gap:10}}><LockKeyhole size={18}/><span>Private evidence bucket</span></div>
          <div style={{display:"flex",gap:10}}><EyeOff size={18}/><span>Only masked values in the UI</span></div>
          <div style={{display:"flex",gap:10}}><ShieldCheck size={18}/><span>Consent and retention audit trail</span></div>
        </div>
      </aside>
    </div>
  );
}
