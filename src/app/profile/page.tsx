import Link from "next/link";
import { BadgeCheck, Leaf, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  return <main className="page">
    <div className="card" style={{padding:30}}>
      <div style={{display:"flex",alignItems:"center",gap:18}}><div className="avatar" style={{width:72,height:72,fontSize:22}}>KT</div><div><div className="eyebrow">Member since 2024</div><h2 style={{margin:"6px 0"}}>Kyaw Thu <BadgeCheck size={22} style={{display:"inline",color:"var(--brand)"}}/></h2><span className="muted">Within 500 m of Junction City</span></div></div>
      <div className="actions"><span className="badge"><ShieldCheck size={14}/> Identity verified</span><span className="badge">Phone verified</span><span className="badge"><Leaf size={14}/> Power buyer</span></div>
      <div className="grid grid-4" style={{marginTop:28}}><div><div className="metric">35</div><div className="stat-label">Completed</div></div><div><div className="metric">34</div><div className="stat-label">Successful COD</div></div><div><div className="metric">3%</div><div className="stat-label">Cancellation</div></div><div><div className="metric">4.9</div><div className="stat-label">Rating</div></div></div>
    </div>
    <div className="actions"><Link className="btn btn-primary" href="/trust">Manage trust profile</Link><Link className="btn btn-quiet" href="/wallet">Open wallet</Link></div>
  </main>;
}
