import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Box, Leaf, MessageCircleWarning, QrCode, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { listings, money } from "@/lib/data";

const features = [
  [ShieldCheck, "Identity you can trust", "Phone-bound NRC verification combines AI-assisted checks with accountable human review."],
  [WalletCards, "Protected payment", "Your balance stays in escrow until both sides confirm the item and handover."],
  [Sparkles, "Condition intelligence", "Before-and-after photo assessment gives every dispute a clear evidence trail."],
  [MessageCircleWarning, "Safer conversations", "Links, phone scraping and off-platform payment requests trigger immediate warnings."],
  [QrCode, "No scheduling needed", "Single-use QR pickup makes direct handovers and partner drop-offs simple and private."],
  [Leaf, "Reuse earns rewards", "Settled trades earn non-cashable Eco-Points for repair shops, cafés and local partners."],
];

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Trust is the new currency</div>
          <h1>Second-hand,<br/>first-choice.</h1>
          <p className="muted">A marketplace built for real people, protected payments and goods you can inspect before the deal is final.</p>
          <div className="actions">
            <Link href="/marketplace" className="btn btn-primary">Explore marketplace <ArrowRight size={17}/></Link>
            <Link href="/sell" className="btn btn-quiet">Sell an item</Link>
          </div>
          <div className="actions muted">
            <span className="badge"><BadgeCheck size={14}/> NRC + phone verified</span>
            <span className="badge"><ShieldCheck size={14}/> Escrow protected</span>
          </div>
        </div>
        <div className="hero-art">
          <div style={{position:"relative",zIndex:2}}>
            <span className="badge" style={{background:"rgba(255,255,255,.16)",color:"white"}}><Box size={14}/> Live protected order</span>
          </div>
          <div className="hero-ticket">
            <div className="meta-row"><span>ORDER RT-2048</span><span className="badge">In inspection</span></div>
            <h3 style={{fontSize:25,marginTop:18}}>iPhone 13 · 128 GB</h3>
            <p className="muted">Seller and shipment evidence verified</p>
            <div className="hero-metric"><span className="stat-label">Protected in escrow</span><strong>{money(1480000)}</strong></div>
            <div className="hero-metric"><span className="stat-label">Approval window</span><strong>22h 18m</strong></div>
          </div>
          <div style={{position:"relative",zIndex:2}}>
            <strong>Both confirm. We release.</strong>
            <p style={{opacity:.72,margin:"6px 0 0"}}>No confirmation means review, never silent payout.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="eyebrow">Made safer by design</div><h2>Confidence at every step</h2></div></div>
        <div className="grid grid-3">
          {features.map(([Icon, title, text]) => (
            <article className="card feature-card" key={String(title)}>
              <div className="iconbox"><Icon size={21}/></div>
              <div><h3>{String(title)}</h3><p className="muted" style={{lineHeight:1.55,marginBottom:0}}>{String(text)}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><div className="eyebrow">Recently verified</div><h2>Worth a second look</h2></div>
          <Link href="/marketplace" className="btn btn-quiet">View all <ArrowRight size={16}/></Link>
        </div>
        <div className="grid grid-3">
          {listings.slice(0,3).map((item) => (
            <Link href={`/marketplace/${item.id}`} className="card product" key={item.id}>
              <Image className="product-img" src={item.image} alt={item.title} width={700} height={520}/>
              <div className="product-body">
                <div className="meta-row"><span>{item.condition}</span>{item.trial && <span className="badge">48h trial</span>}</div>
                <h3 style={{margin:"10px 0 8px"}}>{item.title}</h3>
                <div className="price">{money(item.price)}</div>
                <div className="meta-row" style={{marginTop:14}}><span>{item.location}</span><span>★ {item.rating}</span></div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
