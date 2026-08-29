"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, CircleDollarSign, FileSearch, LockKeyhole, PackageCheck, ShieldCheck, Warehouse } from "lucide-react";
import { money } from "@/lib/data";

type AdminTopUp = {
  id: string;
  requestNumber: string;
  userName: string;
  amountMmk: number;
  transferMethod: string;
  transferReference: string;
  receiptUrl: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

function AdminTopUpQueue({ onNotice }: { onNotice: (notice: string) => void }) {
  const [requests, setRequests] = useState<AdminTopUp[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadQueue = useCallback(async () => {
    const response = await fetch("/api/admin/top-ups", { cache: "no-store" });
    if (response.ok) {
      const result = await response.json() as { requests: AdminTopUp[] };
      setRequests(result.requests);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/top-ups", { cache: "no-store" }).then(async (response) => {
      if (!response.ok || !active) return;
      const result = await response.json() as { requests: AdminTopUp[] };
      setRequests(result.requests);
    });
    return () => { active = false; };
  }, []);

  async function review(id: string, action: "approve" | "reject") {
    if (action === "approve" && !window.confirm("Approve this receipt and credit the member wallet?")) return;
    setSubmitting(true);
    const response = await fetch(`/api/admin/top-ups/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "approve" ? { action } : { action, reason }),
    });
    const result = await response.json() as { error?: string };
    setSubmitting(false);
    if (!response.ok) {
      onNotice(result.error ?? "Unable to review this request.");
      return;
    }
    setReason("");
    setOpenId(null);
    onNotice(action === "approve" ? "Top-up approved and balanced ledger postings created." : "Top-up rejected with an audit reason.");
    await loadQueue();
  }

  if (!requests) return <p className="muted">Live top-up requests appear here when Supabase and admin access are configured.</p>;
  if (requests.length === 0) return <p className="muted">There are no top-up requests to review.</p>;

  return <div className="table-wrap"><table>
    <thead><tr><th>Reference</th><th>Member</th><th>Transfer</th><th>Status</th><th></th></tr></thead>
    <tbody>{requests.map((request)=><Fragment key={request.id}>
      <tr>
        <td><strong>{request.requestNumber}</strong><div className="muted" style={{fontSize:11}}>{new Date(request.createdAt).toLocaleString()}</div></td>
        <td>{request.userName}<div><strong>{money(request.amountMmk)}</strong></div></td>
        <td>{request.transferMethod.replaceAll("_"," ")}<div className="muted" style={{fontSize:11}}>{request.transferReference} · unique ref checked</div></td>
        <td><span className={`badge ${request.status === "pending" ? "badge-warn" : request.status === "rejected" ? "badge-danger" : ""}`}>{request.status}</span></td>
        <td><button className="btn btn-quiet" onClick={()=>setOpenId(openId === request.id ? null : request.id)}>{openId === request.id ? "Close" : "Review"}</button></td>
      </tr>
      {openId === request.id && <tr><td colSpan={5}>
        <section className="card" style={{margin:"4px 0",background:"var(--paper)",whiteSpace:"normal"}}>
          <div className="meta-row"><div><div className="eyebrow">Private payment evidence</div><h3 style={{margin:"7px 0 0"}}>{request.requestNumber}</h3></div>{request.receiptUrl && <a className="btn btn-quiet" href={request.receiptUrl} target="_blank" rel="noreferrer">Open receipt</a>}</div>
          {request.status === "pending" ? <div className="form-grid" style={{marginTop:16}}>
            <button className="btn btn-primary" disabled={submitting} onClick={()=>review(request.id,"approve")}>Approve and credit</button>
            <div className="field"><label htmlFor={`reason-${request.id}`}>Rejection reason</label><input id={`reason-${request.id}`} className="input" minLength={3} maxLength={500} value={reason} onChange={(event)=>setReason(event.target.value)} placeholder="Required to reject"/><button className="btn btn-danger" disabled={submitting || reason.trim().length < 3} onClick={()=>review(request.id,"reject")}>Reject request</button></div>
          </div> : <div className="timeline" style={{marginTop:18}}>
            <div className="timeline-row"><span className="dot done"/><div><strong>Request submitted</strong><div className="muted">Receipt and transfer reference recorded.</div></div></div>
            <div className="timeline-row"><span className="dot done"/><div><strong>Human decision recorded</strong><div className="muted">{request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : request.status}{request.rejectionReason ? ` · ${request.rejectionReason}` : " · balanced wallet credit posted"}</div></div></div>
          </div>}
        </section>
      </td></tr>}
    </Fragment>)}</tbody>
  </table></div>;
}

const queues = {
  identity: [
    ["NRC-3182","Khin Thazin","Photo quality 97%","Review"],
    ["NRC-3181","Aung Pyae","Name similarity 89%","Review"],
    ["NRC-3179","Moe Sandi","Glare detected","Needs resubmission"],
  ],
  wallet: [
    ["TP-8814","Kyaw Thu",money(500000),"Evidence ready"],
    ["TP-8813","Nandar Hlaing",money(1200000),"Reference duplicate"],
    ["TP-8812","Su Mon",money(3000000),"Approved"],
  ],
  disputes: [
    ["DSP-104","RT-2041","Counterfeit claim","Evidence review"],
    ["DSP-102","RT-2028","Stopped working in 2h","Urgent"],
    ["DSP-098","RT-1998","Return condition","Seller response"],
  ],
  logistics: [
    ["G&G Hledan","B-14","Awaiting pickup","22h left"],
    ["City Express 19th","Counter","Drop-off exception","Review"],
    ["G&G Tamwe","A-02","Return deposited","Inspect"],
  ],
};

export function AdminConsole() {
  const [tab,setTab] = useState<keyof typeof queues>("identity");
  const [notice,setNotice] = useState("");
  const [selected,setSelected] = useState<string | null>(null);
  const rows=queues[tab];
  return (
    <>
      <div className="grid grid-4">
        <div className="card"><FileSearch className="iconbox" style={{padding:10}}/><div className="metric" style={{marginTop:14}}>18</div><div className="stat-label">Identity reviews</div></div>
        <div className="card"><CircleDollarSign className="iconbox" style={{padding:10}}/><div className="metric" style={{marginTop:14}}>7</div><div className="stat-label">Top-up requests</div></div>
        <div className="card"><AlertTriangle className="iconbox" style={{padding:10}}/><div className="metric" style={{marginTop:14}}>4</div><div className="stat-label">Open disputes</div></div>
        <div className="card"><Warehouse className="iconbox" style={{padding:10}}/><div className="metric" style={{marginTop:14}}>12</div><div className="stat-label">Locker events</div></div>
      </div>
      <section className="section">
        <div className="card">
          <div className="tabs">
            {(["identity","wallet","disputes","logistics"] as const).map((item)=><button key={item} className={`tab ${tab===item?"active":""}`} onClick={()=>{setTab(item);setNotice("");setSelected(null)}}>{item[0].toUpperCase()+item.slice(1)}</button>)}
          </div>
          {tab === "wallet" ? <AdminTopUpQueue onNotice={setNotice}/> : <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Account / order</th><th>Signal</th><th>Status</th><th></th></tr></thead><tbody>
            {rows.map(row=><Fragment key={row[0]}><tr><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td><span className={String(row[3]).match(/duplicate|Urgent|resubmission/)?"badge badge-danger":"badge"}>{row[3]}</span></td><td><button className="btn btn-quiet" onClick={()=>{setSelected(row[0]);setNotice(`${row[0]} opened with a complete audit timeline.`)}}>Open</button></td></tr>
              {selected===row[0] && <tr><td colSpan={5}>
                <section className="card" style={{margin:"4px 0",background:"var(--paper)",whiteSpace:"normal"}}>
                  <div className="meta-row"><div><div className="eyebrow">Immutable audit timeline</div><h3 style={{margin:"7px 0 0"}}>{selected}</h3></div><button className="btn btn-quiet" onClick={()=>setSelected(null)}>Close</button></div>
                  <div className="timeline" style={{marginTop:18}}>
                    <div className="timeline-row"><span className="dot done"/><div><strong>Case created</strong><div className="muted">Applicant submitted consent and private evidence · 09:42</div></div></div>
                    <div className="timeline-row"><span className="dot done"/><div><strong>Automated checks completed</strong><div className="muted">Photo quality, duplicate and consistency signals recorded · 09:43</div></div></div>
                    <div className="timeline-row"><span className="dot"/><div><strong>Human decision required</strong><div className="muted">No automated signal can approve, reject, or release funds.</div></div></div>
                  </div>
                </section>
              </td></tr>}
            </Fragment>)}
          </tbody></table></div>}
          {notice && <div className="trust-banner" style={{marginTop:16}}><BadgeCheck size={19}/>{notice}</div>}
        </div>
      </section>
      <section className="grid grid-3">
        <div className="card"><LockKeyhole className="iconbox" style={{padding:10}}/><h3 style={{marginTop:16}}>Dual-control funding</h3><p className="muted">Top-ups require evidence, unique references and balanced postings. Reversals preserve history.</p></div>
        <div className="card"><ShieldCheck className="iconbox" style={{padding:10}}/><h3 style={{marginTop:16}}>Policy controls</h3><p className="muted">Configure trial eligibility, deposit rates, fees, dispute windows and Power Seller thresholds.</p></div>
        <div className="card"><PackageCheck className="iconbox" style={{padding:10}}/><h3 style={{marginTop:16}}>Partner adapters</h3><p className="muted">Operate fallback locker, IMEI and rewards workflows until approved providers are connected.</p></div>
      </section>
    </>
  );
}
