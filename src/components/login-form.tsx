"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Phone, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [sent,setSent]=useState(false);
  const [done,setDone]=useState(false);
  const [phone,setPhone]=useState("+95 ");
  const [code,setCode]=useState("");
  const [error,setError]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const supabase = createClient();

  async function sendCode() {
    setError("");
    if (!supabase) {
      setSent(true);
      setCode("482916");
      return;
    }
    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithOtp({ phone: phone.replace(/\s/g, "") });
    setSubmitting(false);
    if (authError) setError(authError.message);
    else setSent(true);
  }

  async function verifyCode() {
    setError("");
    if (!supabase) {
      setDone(true);
      return;
    }
    setSubmitting(true);
    const { error: authError } = await supabase.auth.verifyOtp({
      phone: phone.replace(/\s/g, ""),
      token: code,
      type: "sms",
    });
    setSubmitting(false);
    if (authError) setError(authError.message);
    else {
      setDone(true);
      router.refresh();
    }
  }

  return <div className="card" style={{maxWidth:470,margin:"30px auto"}}>
    <div className="iconbox">{done?<BadgeCheck size={21}/>:<Phone size={21}/>}</div>
    <h2 style={{marginTop:18}}>{done?"Welcome back":"Sign in with your phone"}</h2>
    {!done?<><p className="muted">Your NRC verifies trust; it is never used as a password. We send a one-time code to your bound mobile.</p>
      {!sent?<div className="field"><label htmlFor="phone">Myanmar mobile number</label><input id="phone" className="input" type="tel" value={phone} onChange={(event)=>setPhone(event.target.value)}/><button className="btn btn-primary" disabled={submitting} onClick={sendCode}>{submitting ? "Sending…" : "Send secure code"} <ArrowRight size={16}/></button></div>:
      <div className="field"><label htmlFor="otp">6-digit verification code</label><input id="otp" className="input" inputMode="numeric" maxLength={6} value={code} onChange={(event)=>setCode(event.target.value.replace(/\D/g,""))}/><button className="btn btn-primary" disabled={submitting || code.length !== 6} onClick={verifyCode}>{submitting ? "Verifying…" : "Verify and sign in"}</button><button className="btn btn-quiet" onClick={()=>{setSent(false);setCode("");setError("")}}>Use another number</button></div>}
      {error && <div className="warning" style={{marginTop:12}}>{error}</div>}</>:
      <><div className="trust-banner"><ShieldCheck size={22}/><div><strong>Identity + phone verified</strong><div className="muted">Session protected</div></div></div><Link href="/marketplace" className="btn btn-primary" style={{width:"100%",marginTop:16}}>Continue to marketplace</Link></>}
  </div>;
}
