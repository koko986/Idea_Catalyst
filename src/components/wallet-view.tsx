"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, FileText, Leaf, LockKeyhole, Plus, X } from "lucide-react";
import { money } from "@/lib/data";
import { demoWallet, topUpStatusLabel, type WalletSnapshot } from "@/lib/wallet";

const transferLabels = {
  bank_transfer: "Bank transfer",
  kpay: "KBZPay",
  wavepay: "WavePay",
  aya_pay: "AYA Pay",
};

export function WalletView({ suggestedAmount = 0 }: { suggestedAmount?: number }) {
  const [wallet, setWallet] = useState<WalletSnapshot>(demoWallet);
  const [live, setLive] = useState(false);
  const [showTopUp, setShowTopUp] = useState(suggestedAmount > 0);
  const [amount, setAmount] = useState(suggestedAmount ? String(Math.max(1_000, suggestedAmount)) : "");
  const [method, setMethod] = useState<keyof typeof transferLabels>("bank_transfer");
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const statementRef = useRef<HTMLElement>(null);

  const loadWallet = useCallback(async () => {
    const response = await fetch("/api/wallet", { cache: "no-store" });
    if (!response.ok) return;
    setWallet(await response.json() as WalletSnapshot);
    setLive(true);
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/wallet", { cache: "no-store" }).then(async (response) => {
      if (!response.ok || !active) return;
      setWallet(await response.json() as WalletSnapshot);
      setLive(true);
    });
    return () => { active = false; };
  }, []);

  async function submitTopUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    if (!receipt) {
      setNotice("Upload your payment receipt before submitting.");
      return;
    }
    setSubmitting(true);
    const form = new FormData();
    form.set("amountMmk", amount);
    form.set("transferMethod", method);
    form.set("transferReference", reference);
    form.set("evidence", receipt);
    const response = await fetch("/api/wallet", { method: "POST", body: form });
    const result = await response.json() as { error?: string; requestNumber?: string };
    setSubmitting(false);
    if (!response.ok) {
      setNotice(result.error ?? "Unable to submit top-up request.");
      return;
    }
    setNotice(`${result.requestNumber} was submitted for admin review.`);
    setAmount("");
    setReference("");
    setReceipt(null);
    await loadWallet();
  }

  function exportStatement() {
    const rows = [
      ["Description", "Amount (MMK)", "Date / status"],
      ...wallet.activity.map((item) => [item.label, String(item.amountMmk), item.note]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pyanthit-wallet-statement.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="split">
      <div>
        <div className="wallet-card">
          <div className="meta-row" style={{color:"rgba(255,255,255,.7)"}}>
            <span>AVAILABLE BALANCE {!live && "· DEMO"}</span><LockKeyhole size={18}/>
          </div>
          <div className="metric" style={{margin:"18px 0 3px"}}>{money(wallet.availableMmk)}</div>
          <div style={{opacity:.7}}>{money(wallet.heldMmk)} held separately in escrow</div>
          <div className="actions">
            <button className="btn btn-lime" onClick={()=>setShowTopUp(true)}><Plus size={17}/> Add money</button>
            <button className="btn" style={{background:"rgba(255,255,255,.12)",color:"white"}} onClick={()=>statementRef.current?.scrollIntoView({behavior:"smooth"})}>View statement</button>
          </div>
        </div>

        {showTopUp && <form className="card" style={{marginTop:16}} onSubmit={submitTopUp}>
          <div className="meta-row">
            <div><div className="eyebrow">Manual verification</div><h2 style={{fontSize:28,margin:"6px 0"}}>Add money</h2></div>
            <button type="button" className="btn btn-quiet" aria-label="Close top-up form" onClick={()=>setShowTopUp(false)}><X size={17}/></button>
          </div>
          <p className="muted">Transfer funds using your chosen method, then upload the receipt. Money becomes spendable only after an admin verifies it.</p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="top-up-amount">Amount (MMK)</label>
              <input id="top-up-amount" className="input" type="number" min={1000} max={100000000} step={1000} value={amount} onChange={(event)=>setAmount(event.target.value)} required/>
            </div>
            <div className="field">
              <label htmlFor="transfer-method">Transfer method</label>
              <select id="transfer-method" className="input" value={method} onChange={(event)=>setMethod(event.target.value as keyof typeof transferLabels)}>
                {Object.entries(transferLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <div className="trust-banner" style={{marginTop:14}}>
            <LockKeyhole size={20}/><div><strong>{transferLabels[method]} funding instructions</strong><div className="muted" style={{fontSize:12}}>Use the approved PyanThit collection account shown by operations, and keep the transaction reference.</div></div>
          </div>
          <div className="form-grid" style={{marginTop:14}}>
            <div className="field">
              <label htmlFor="transfer-reference">Transaction reference</label>
              <input id="transfer-reference" className="input" minLength={4} maxLength={80} value={reference} onChange={(event)=>setReference(event.target.value)} placeholder="e.g. KBZ-482916" required/>
            </div>
            <div className="field">
              <label htmlFor="payment-receipt">Payment receipt</label>
              <input id="payment-receipt" className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>setReceipt(event.target.files?.[0] ?? null)} required/>
            </div>
          </div>
          <button className="btn btn-primary" style={{marginTop:16}} disabled={submitting}>{submitting ? "Submitting…" : "Submit for review"}</button>
          {notice && <div className={notice.includes("submitted") ? "trust-banner" : "warning"} style={{marginTop:14}}>{notice}</div>}
        </form>}

        {wallet.requests.length > 0 && <section className="section" style={{paddingBottom:0}}>
          <h2>Top-up requests</h2>
          <div className="grid">
            {wallet.requests.map((request)=><div className="card" key={request.id}>
              <div className="meta-row">
                <div><strong>{request.requestNumber}</strong><div className="muted" style={{fontSize:12,marginTop:4}}>{transferLabels[request.transferMethod as keyof typeof transferLabels] ?? request.transferMethod} · {request.transferReference}</div></div>
                <span className={`badge ${request.status === "pending" ? "badge-warn" : request.status === "rejected" ? "badge-danger" : ""}`}>{topUpStatusLabel(request.status)}</span>
              </div>
              <div className="metric" style={{fontSize:24,marginTop:14}}>{money(request.amountMmk)}</div>
              {request.rejectionReason && <p className="warning" style={{marginTop:12,marginBottom:0}}>{request.rejectionReason}</p>}
            </div>)}
          </div>
        </section>}

        <section className="section" ref={statementRef}>
          <div className="section-head"><h2>Activity</h2><button className="btn btn-quiet" onClick={exportStatement}><FileText size={16}/> Export CSV</button></div>
          <div className="card" style={{padding:4}}>
            {wallet.activity.map((item)=><div key={item.id} style={{display:"grid",gridTemplateColumns:"42px 1fr auto",gap:12,alignItems:"center",padding:15,borderBottom:"1px solid var(--line)"}}>
              <div className="iconbox">{item.amountMmk>0?<ArrowDownLeft size={18}/>:<ArrowUpRight size={18}/>}</div>
              <div><strong>{item.label}</strong><div className="muted" style={{fontSize:12,marginTop:4}}>{item.note}</div></div>
              <strong style={{color:item.amountMmk>0?"var(--brand)":"var(--ink)"}}>{item.amountMmk>0?"+":""}{money(item.amountMmk)}</strong>
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
