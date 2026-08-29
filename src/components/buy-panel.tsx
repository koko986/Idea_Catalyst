"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, ShieldCheck, WalletCards } from "lucide-react";
import { money } from "@/lib/data";
import { listingThreadId } from "@/lib/chat";
import { demoWallet, type WalletSnapshot } from "@/lib/wallet";

export function BuyPanel({ listingId, price, trial }: { listingId: string; price: number; trial: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState(trial ? "trial" : "standard");
  const [notice, setNotice] = useState("");
  const [balance, setBalance] = useState(demoWallet.availableMmk);
  const [walletMode, setWalletMode] = useState<"demo" | "live" | "auth-required" | "unavailable">("demo");
  const [submitting, setSubmitting] = useState(false);
  const shortfall = Math.max(0, price - balance);

  useEffect(() => {
    async function loadBalance() {
      const response = await fetch("/api/wallet", { cache: "no-store" });
      if (response.ok) {
        const wallet = await response.json() as WalletSnapshot;
        setBalance(wallet.availableMmk);
        setWalletMode("live");
      } else if (response.status === 401) {
        setBalance(0);
        setWalletMode("auth-required");
      } else if (response.status !== 503) {
        setBalance(0);
        setWalletMode("unavailable");
      }
    }
    void loadBalance();
  }, []);

  async function checkout() {
    if (walletMode === "demo") {
      setNotice(`${money(price)} reserved securely. Checkout RT-NEW is ready.`);
      return;
    }
    setSubmitting(true);
    setNotice("");
    const response = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, trialMode: mode === "trial" }),
    });
    const result = await response.json() as { error?: string; orderId?: string };
    setSubmitting(false);
    if (!response.ok || !result.orderId) {
      setNotice(result.error ?? "Unable to secure this order.");
      return;
    }
    router.push(`/orders/${result.orderId}`);
  }

  return (
    <div className="card sidebar">
      <div className="price">{money(price)}</div>
      <p className="muted" style={{marginTop:8}}>Balance available: {money(balance)} {walletMode === "demo" && "· demo"}</p>
      <div className="trust-banner"><ShieldCheck size={24}/><div><strong>Escrow protected</strong><div className="muted" style={{fontSize:12}}>Released only after both confirm</div></div></div>
      {trial && <div className="field" style={{marginTop:16}}>
        <label>Protection mode</label>
        <select className="input" value={mode} onChange={(e)=>setMode(e.target.value)}>
          <option value="trial">48-hour try-before-finalizing</option>
          <option value="standard">24-hour standard inspection</option>
        </select>
      </div>}
      {walletMode === "auth-required"
        ? <Link href="/login" className="btn btn-primary" style={{width:"100%",marginTop:16}}>Sign in to buy</Link>
        : shortfall > 0
          ? <><div className="warning" style={{marginTop:16}}>Add {money(shortfall)} more before checkout.</div><Link href={`/wallet?amount=${shortfall}`} className="btn btn-primary" style={{width:"100%",marginTop:8}}><WalletCards size={17}/> Add funds</Link></>
          : <button className="btn btn-primary" style={{width:"100%",marginTop:16}} disabled={submitting || walletMode === "unavailable"} onClick={checkout}>{submitting ? "Securing funds…" : "Secure in escrow"}</button>}
      <Link href={`/chat/${listingThreadId(listingId)}`} className="btn btn-quiet" style={{width:"100%",marginTop:8}}>Message seller</Link>
      {notice && <div className={notice.includes("ready") ? "badge" : "warning"} style={{marginTop:14,borderRadius:10}}><BadgeCheck size={15}/>{notice}</div>}
      <p className="muted" style={{fontSize:12,lineHeight:1.5,margin:"16px 0 0"}}>A missing confirmation opens review. PyanThit never silently releases your funds.</p>
    </div>
  );
}
