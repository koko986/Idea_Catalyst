import { notFound } from "next/navigation";
import Image from "next/image";
import { BadgeCheck, BatteryCharging, Leaf, ScanSearch, ShieldCheck, Smartphone } from "lucide-react";
import { listings } from "@/lib/data";
import { BuyPanel } from "@/components/buy-panel";

export function generateStaticParams() {
  return listings.map((item) => ({ id: item.id }));
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = listings.find((listing) => listing.id === id);
  if (!item) notFound();
  return (
    <main className="page">
      <div className="split">
        <div>
          <Image src={item.image} alt={item.title} width={1000} height={750} className="product-img" style={{borderRadius:24}} priority/>
          <div className="meta-row" style={{margin:"12px 4px 28px"}}><span>Watermarked for {item.seller} · Aug 29, 2026</span><span>No duplicate matches</span></div>
          <div className="eyebrow">{item.category} · {item.condition}</div>
          <h1 style={{fontSize:"clamp(38px,5vw,62px)",margin:"10px 0 14px"}}>{item.title}</h1>
          <p className="muted" style={{fontSize:18,lineHeight:1.6}}>Carefully used and fully tested. Original accessories are included. The exact pickup point stays private until a protected order begins.</p>
          <div className="grid grid-3" style={{marginTop:24}}>
            <div className="card"><ScanSearch className="iconbox" style={{padding:10}}/><h3 style={{marginTop:18}}>AI condition check</h3><p className="muted">93% visual consistency. No unlisted cracks detected.</p></div>
            <div className="card"><Smartphone className="iconbox" style={{padding:10}}/><h3 style={{marginTop:18}}>IMEI screened</h3><p className="muted">Checksum valid, unique on PyanThit, registry review passed.</p></div>
            <div className="card"><BatteryCharging className="iconbox" style={{padding:10}}/><h3 style={{marginTop:18}}>Function tested</h3><p className="muted">Camera, battery, display and connectivity evidence recorded.</p></div>
          </div>
          <section className="section">
            <h2>Meet the seller</h2>
            <div className="card">
              <div style={{display:"flex",gap:15,alignItems:"center"}}>
                <div className="avatar" style={{width:54,height:54}}>MT</div>
                <div><h3 style={{marginBottom:5}}>{item.seller} <BadgeCheck size={17} style={{display:"inline",color:"var(--brand)"}}/></h3><span className="muted">{item.location}</span></div>
              </div>
              <div className="grid grid-4" style={{marginTop:22}}>
                <div><div className="metric">250</div><div className="stat-label">Completed orders</div></div>
                <div><div className="metric">98%</div><div className="stat-label">Successful delivery</div></div>
                <div><div className="metric">2%</div><div className="stat-label">Cancellation rate</div></div>
                <div><div className="metric">4.8</div><div className="stat-label">Customer rating</div></div>
              </div>
              <div className="actions"><span className="badge"><ShieldCheck size={14}/> Identity verified</span><span className="badge"><BadgeCheck size={14}/> Power seller</span><span className="badge"><Leaf size={14}/> 4,820 kg saved</span></div>
            </div>
          </section>
        </div>
        <BuyPanel price={item.price} trial={item.trial}/>
      </div>
    </main>
  );
}
