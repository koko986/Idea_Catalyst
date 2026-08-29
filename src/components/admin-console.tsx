"use client";

import { Fragment, useState } from "react";
import { AlertTriangle, BadgeCheck, CircleDollarSign, FileSearch, LockKeyhole, PackageCheck, ShieldCheck, Warehouse } from "lucide-react";
import { money } from "@/lib/data";

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
          <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Account / order</th><th>Signal</th><th>Status</th><th></th></tr></thead><tbody>
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
          </tbody></table></div>
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
