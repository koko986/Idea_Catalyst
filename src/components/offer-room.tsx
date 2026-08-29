"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, Clock3, RefreshCcw, Tag, UserRoundCheck, XCircle } from "lucide-react";
import { money } from "@/lib/data";
import {
  cancelSelection,
  confirmSelectedBuyer,
  counterOffer,
  expireSelection,
  selectBuyer,
  type Negotiation,
} from "@/lib/offers";

const initial: Negotiation = {
  listingId: "iphone-13",
  selectedOfferId: null,
  confirmationDeadline: null,
  round: 0,
  offers: [
    { id: "OF-104", buyerName: "Kyaw Thu", amountMmk: 1_420_000, message: "Can collect from SafeZone today.", status: "active", responseMinutes: 4 },
    { id: "OF-103", buyerName: "Nway Oo", amountMmk: 1_480_000, message: "Full price with 48-hour trial.", status: "active", responseMinutes: 9 },
    { id: "OF-101", buyerName: "Min Zaw", amountMmk: 1_360_000, message: "Flexible on pickup time.", status: "active", responseMinutes: 13 },
  ],
};

export function OfferRoom() {
  const [state, setState] = useState(initial);
  const [notice, setNotice] = useState("Three verified buyers are interested.");
  const selected = state.offers.find((offer) => offer.id === state.selectedOfferId);

  function choose(id: string) {
    setState((current) => selectBuyer(current, id));
    setNotice("Buyer selected. Everyone else moved to Waiting for 24 hours.");
  }

  function counter(id: string, delta: number) {
    setState((current) => {
      const offer = current.offers.find((item) => item.id === id)!;
      return counterOffer(current, id, Math.max(0, offer.amountMmk + delta));
    });
    setNotice(delta > 0 ? "Counter price increased and sent to the buyer." : "Seller discount sent to the buyer.");
  }

  function confirm() {
    if (!state.selectedOfferId) return;
    setState((current) => confirmSelectedBuyer(current, current.selectedOfferId!));
    setNotice("Buyer confirmed. The listing is reserved and ready for escrow funding.");
  }

  function cancel(actor: "buyer" | "seller") {
    setState((current) => cancelSelection(current, actor));
    setNotice(`Transaction cancelled by ${actor}. Waiting buyers are available again.`);
  }

  function expire() {
    setState((current) => expireSelection(current, (current.confirmationDeadline ?? Date.now()) + 1));
    setNotice("The 24-hour window expired. Waiting buyers are available again for selection.");
  }

  return (
    <div className="split">
      <section>
        <div className="card">
          <div className="meta-row"><span>IPHONE 13 · OPEN TO OFFERS</span><span className="badge">Round {state.round + 1}</span></div>
          <h2 style={{margin:"14px 0 6px"}}>Choose the right buyer</h2>
          <p className="muted">Negotiate up or offer a discount. Selecting one buyer starts a 24-hour confirmation window without permanently rejecting the others.</p>
          <div className="trust-banner"><RefreshCcw size={19}/><span>{notice}</span></div>
        </div>
        <div className="grid" style={{marginTop:16}}>
          {state.offers.map((offer) => (
            <article className="card offer-card" key={offer.id}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}><h3 style={{margin:0}}>{offer.buyerName}</h3><BadgeCheck size={16} style={{color:"var(--brand)"}}/></div>
                <div className="muted" style={{fontSize:13,marginTop:6}}>{offer.id} · replies in ~{offer.responseMinutes} min</div>
                <p style={{margin:"13px 0 0"}}>{offer.message}</p>
              </div>
              <div className="offer-actions">
                <div><div className="price">{money(offer.amountMmk)}</div><span className={`badge ${offer.status==="selected"?"badge-warn":offer.status==="cancelled"||offer.status==="expired"?"badge-danger":""}`}>{offer.status.replace("_"," ")}</span></div>
                {["active","countered"].includes(offer.status) && <div className="actions" style={{marginTop:0}}>
                  <button className="btn btn-quiet" onClick={()=>counter(offer.id,-50_000)}><Tag size={15}/> Discount 50k</button>
                  <button className="btn btn-quiet" onClick={()=>counter(offer.id,50_000)}>Counter +50k</button>
                  <button className="btn btn-primary" onClick={()=>choose(offer.id)}><UserRoundCheck size={16}/> Choose buyer</button>
                </div>}
                {offer.status==="selected" && <span className="muted"><Clock3 size={15} style={{display:"inline"}}/> Awaiting buyer confirmation</span>}
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="sidebar">
        <div className="card">
          <div className="eyebrow">Selection status</div>
          {selected ? <>
            <h3 style={{fontSize:25,margin:"10px 0 6px"}}>{selected.buyerName}</h3>
            <p className="muted">{selected.status==="confirmed" ? "Confirmed — proceed to protected checkout." : "Selected buyer has 24 hours to confirm the order."}</p>
            {selected.status==="selected" && <>
              <button className="btn btn-primary" style={{width:"100%"}} onClick={confirm}><CheckCircle2 size={16}/> Confirm as selected buyer</button>
              <button className="btn btn-quiet" style={{width:"100%",marginTop:8}} onClick={expire}><Clock3 size={16}/> Simulate 24h expiry</button>
              <button className="btn btn-quiet" style={{width:"100%",marginTop:8}} onClick={()=>cancel("buyer")}><XCircle size={16}/> Buyer cancels</button>
              <button className="btn btn-danger" style={{width:"100%",marginTop:8}} onClick={()=>cancel("seller")}>Seller cancels</button>
            </>}
            {selected.status==="confirmed" && <Link href="/orders" className="btn btn-primary" style={{width:"100%"}}>Open protected order</Link>}
          </> : <><h3 style={{fontSize:25,margin:"10px 0 6px"}}>No buyer selected</h3><p className="muted">All active buyers can still negotiate. Choose one when you are ready.</p></>}
        </div>
        <div className="card" style={{marginTop:16}}><h3>Fair selection loop</h3><p className="muted">If the chosen buyer declines, cancels, or misses 24 hours, waiting offers automatically become available. The seller can then choose again.</p></div>
      </aside>
    </div>
  );
}
