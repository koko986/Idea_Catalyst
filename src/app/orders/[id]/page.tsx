import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { money } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function FundedOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) notFound();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  const { data: order } = await supabase.from("orders")
    .select("id,order_number,status,price_mmk,trial_mode,created_at,listings(title)")
    .eq("id", id).maybeSingle();
  if (!order) notFound();
  const listing = order.listings as unknown as { title: string } | null;

  return <main className="page">
    <div className="eyebrow">Funds secured</div>
    <h1 style={{fontSize:"clamp(40px,6vw,68px)"}}>Your order is<br/>escrow protected.</h1>
    <div className="card" style={{maxWidth:720}}>
      <div className="trust-banner"><CheckCircle2 size={24}/><div><strong>Payment held successfully</strong><div className="muted">The seller cannot receive it until the protected order completes.</div></div></div>
      <div className="meta-row" style={{marginTop:22}}><span>ORDER</span><strong>{order.order_number}</strong></div>
      <div className="meta-row" style={{marginTop:14}}><span>ITEM</span><strong>{listing?.title ?? "Protected marketplace item"}</strong></div>
      <div className="meta-row" style={{marginTop:14}}><span>AMOUNT HELD</span><strong>{money(Number(order.price_mmk))}</strong></div>
      <div className="meta-row" style={{marginTop:14}}><span>PROTECTION</span><strong>{order.trial_mode ? "48-hour trial" : "24-hour inspection"}</strong></div>
      <div className="actions"><Link href="/orders" className="btn btn-primary"><ShieldCheck size={17}/> View order journey</Link><Link href="/wallet" className="btn btn-quiet">Open wallet</Link></div>
    </div>
  </main>;
}
