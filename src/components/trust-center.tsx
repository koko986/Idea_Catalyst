"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeCheck, Camera, CheckCircle2, EyeOff, LockKeyhole, Phone, ShieldCheck, Sparkles } from "lucide-react";

type StatsRole = "seller" | "buyer";

const roleStats: Record<StatsRole, { metrics: { value: string; label: string }[]; score: number; level: string }> = {
  seller: {
    score: 96,
    level: "Level 5 Trusted",
    metrics: [
      { value: "18", label: "Completed sales" },
      { value: "17", label: "Successful payouts" },
      { value: "2%", label: "Cancellation rate" },
      { value: "4.8", label: "Community rating" },
    ],
  },
  buyer: {
    score: 96,
    level: "Level 5 Trusted",
    metrics: [
      { value: "35", label: "Completed orders" },
      { value: "34", label: "Successful payments" },
      { value: "3%", label: "Cancellation rate" },
      { value: "4.9", label: "Community rating" },
    ],
  },
};

const deliveryEvidence = [
  { label: "Item Photo", image: "https://images.unsplash.com/photo-1637930030016-8a1cda6b3809?auto=format&fit=crop&w=600&q=80" },
  { label: "Package & Waybill", image: "https://images.unsplash.com/photo-1631010231130-5c7828d9a3a7?auto=format&fit=crop&w=600&q=80" },
  { label: "Timestamped Location", image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=600&q=80" },
  { label: "Unboxing Proof", image: "https://images.unsplash.com/photo-1702289612974-dc67693a8cd4?auto=format&fit=crop&w=600&q=80" },
];

function UploadSlot({ label, hint, uploaded, onToggle }: { label: string; hint: string; uploaded: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`upload${uploaded ? " uploaded" : ""}`} aria-pressed={uploaded} onClick={onToggle}>
      {uploaded ? <CheckCircle2 size={26}/> : <Camera size={26}/>}
      <strong>{label}</strong>
      <p className={uploaded ? undefined : "muted"}>{uploaded ? "Image Uploaded & Encrypted (AES-256)" : hint}</p>
    </button>
  );
}

function TrustRing({ score }: { score: number }) {
  const size = 132;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="trust-ring-wrap" aria-hidden>
      <svg className="trust-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="trust-ring-track" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="trust-ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="trust-ring-label">
        <strong>{score}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

export function TrustCenter() {
  const [status, setStatus] = useState<"verified" | "new">("verified");
  const [role, setRole] = useState<StatsRole>("seller");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [nrcFrontUploaded, setNrcFrontUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const stats = roleStats[role];

  function openRenewal() {
    setNrcFrontUploaded(false);
    setSelfieUploaded(false);
    setStatus("new");
  }

  return (
    <div className="split">
      <div>
        <div className="stats-toggle" role="group" aria-label="Trust stats">
          <button type="button" aria-pressed={role === "seller"} onClick={() => setRole("seller")}>Seller Stats</button>
          <button type="button" aria-pressed={role === "buyer"} onClick={() => setRole("buyer")}>Buyer Stats</button>
        </div>
        <div className="grid grid-4">
          {stats.metrics.map((metric) => (
            <div className="card" key={`${role}-${metric.label}`}>
              <div className="metric">{metric.value}</div>
              <div className="stat-label">{metric.label}</div>
            </div>
          ))}
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
          <div className="section-head"><div><div className="eyebrow">Protected delivery</div><h2>Order Delivery Verification Evidence</h2></div></div>
          <div className="card">
            <div className="meta-row">
              <div>
                <strong>Order #PT-9942</strong>
                <p className="muted" style={{margin:"6px 0 0"}}>iPhone 13 · 128 GB · captured Aug 28, 14:32</p>
              </div>
              <span className="badge"><CheckCircle2 size={14}/> Dispute Evidence Ready</span>
            </div>
            <div className="evidence-thumbs">
              {deliveryEvidence.map((item) => (
                <figure className="evidence-thumb" key={item.label}>
                  <Image src={item.image} alt={item.label} width={320} height={240} />
                  <figcaption>{item.label}</figcaption>
                </figure>
              ))}
            </div>
            <button className="btn btn-primary" style={{marginTop:16}} onClick={() => setEvidenceOpen((open) => !open)}>
              View Verification Details
            </button>
            {evidenceOpen && (
              <div className="trust-banner" style={{marginTop:16}}>
                <ShieldCheck size={22}/>
                <div>
                  <strong>Four-photo chain sealed for Order #PT-9942</strong>
                  <div className="muted">Item, package & waybill, timestamped locker location, and unboxing proof stored in the private evidence bucket.</div>
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="section">
          <h2>NRC verification case</h2>
          {status==="verified" ? <div className="card"><div className="trust-banner"><BadgeCheck size={26}/><div><strong>Human review complete</strong><div className="muted">AI photo quality 98% · text consistency 96% · approved by KY-04</div></div></div><button className="btn btn-quiet" style={{marginTop:16}} onClick={openRenewal}>Preview renewal flow</button></div> :
          <div className="card"><div className="form-grid"><UploadSlot label="NRC front" hint="Private upload" uploaded={nrcFrontUploaded} onToggle={()=>setNrcFrontUploaded((value)=>!value)}/><UploadSlot label="Selfie check" hint="Live photo recommended" uploaded={selfieUploaded} onToggle={()=>setSelfieUploaded((value)=>!value)}/></div><div className="field" style={{marginTop:16}}><label>Full legal name</label><input className="input" placeholder="As shown on NRC"/></div><button className="btn btn-primary" style={{marginTop:16}} onClick={()=>setStatus("verified")}>Submit for assisted review</button></div>}
        </section>
      </div>
      <aside className="sidebar">
        <div className="card trust-score-card">
          <div className="eyebrow">Calculated trust score</div>
          <div className="trust-score-visual">
            <TrustRing score={stats.score} />
            <div>
              <div className="metric">{stats.score}/100</div>
              <p className="muted" style={{margin:"6px 0 12px"}}>({stats.level})</p>
              <span className="badge"><BadgeCheck size={14}/> {stats.level}</span>
            </div>
          </div>
          <p className="muted">Score from completion, payouts, cancellations, and community rating for this role.</p>
        </div>
        <div className="card" style={{marginTop:16}}>
          <div className="eyebrow">Privacy by default</div><h3 style={{fontSize:25,marginTop:10}}>Your NRC is not your password.</h3>
          <p className="muted">You sign in with a one-time code. NRC evidence is encrypted, private and opened only through expiring admin access.</p>
          <div className="grid">
            <div style={{display:"flex",gap:10}}><LockKeyhole size={18}/><span>Private evidence bucket</span></div>
            <div style={{display:"flex",gap:10}}><EyeOff size={18}/><span>Only masked values in the UI</span></div>
            <div style={{display:"flex",gap:10}}><ShieldCheck size={18}/><span>Consent and retention audit trail</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
