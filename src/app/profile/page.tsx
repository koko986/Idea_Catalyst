import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Leaf, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { logout } from "@/app/login/actions";
import { getSession } from "@/lib/auth/session";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <main className="page">
    <div className="card" style={{padding:30}}>
      <div style={{display:"flex",alignItems:"center",gap:18}}><div className="avatar" style={{width:72,height:72,fontSize:22}}>{session.initials}</div><div><div className="eyebrow">{session.role === "admin" ? "Administrator account" : "User account"}</div><h2 style={{margin:"6px 0"}}>{session.name} <BadgeCheck size={22} style={{display:"inline",color:"var(--brand)"}}/></h2><span className="muted">{session.email}</span></div></div>
      <div className="actions"><span className="badge"><ShieldCheck size={14}/> Signed in</span><span className="badge">Password protected</span><span className="badge"><Leaf size={14}/> Power buyer</span></div>
      <div className="grid grid-4" style={{marginTop:28}}><div><div className="metric">35</div><div className="stat-label">Completed</div></div><div><div className="metric">34</div><div className="stat-label">Successful COD</div></div><div><div className="metric">3%</div><div className="stat-label">Cancellation</div></div><div><div className="metric">4.9</div><div className="stat-label">Rating</div></div></div>
    </div>
    <div className="actions">
      <Link className="btn btn-primary" href="/trust">Manage trust profile</Link>
      <Link className="btn btn-quiet" href="/wallet">Open wallet</Link>
      <form action={logout}><button className="btn btn-quiet" type="submit"><RefreshCw size={16}/> Switch account</button></form>
      <form action={logout}><button className="btn btn-danger" type="submit"><LogOut size={16}/> Sign out</button></form>
    </div>
  </main>;
}
