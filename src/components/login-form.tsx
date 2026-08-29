"use client";

import { useState } from "react";
import { ArrowRight, BadgeCheck, Phone, ShieldCheck } from "lucide-react";

export function LoginForm() {
  const [sent,setSent]=useState(false);
  const [done,setDone]=useState(false);
  return <div className="card" style={{maxWidth:470,margin:"30px auto"}}>
    <div className="iconbox">{done?<BadgeCheck size={21}/>:<Phone size={21}/>}</div>
    <h2 style={{marginTop:18}}>{done?"Welcome back":"Sign in with your phone"}</h2>
    {!done?<><p className="muted">Your NRC verifies trust; it is never used as a password. We send a one-time code to your bound mobile.</p>
      {!sent?<div className="field"><label>Myanmar mobile number</label><input className="input" defaultValue="+95 "/><button className="btn btn-primary" onClick={()=>setSent(true)}>Send secure code <ArrowRight size={16}/></button></div>:
      <div className="field"><label>6-digit verification code</label><input className="input" inputMode="numeric" maxLength={6} defaultValue="482916"/><button className="btn btn-primary" onClick={()=>setDone(true)}>Verify and sign in</button><button className="btn btn-quiet" onClick={()=>setSent(false)}>Use another number</button></div>}</>:
      <><div className="trust-banner"><ShieldCheck size={22}/><div><strong>Identity + phone verified</strong><div className="muted">Session protected</div></div></div><a href="/marketplace" className="btn btn-primary" style={{width:"100%",marginTop:16}}>Continue to marketplace</a></>}
  </div>;
}
