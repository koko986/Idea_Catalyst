"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { listings, money } from "@/lib/data";
import { listingMatches, type MarketplaceFilters } from "@/lib/search";

export function MarketplaceGrid() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [visualIds, setVisualIds] = useState<string[] | null>(null);
  const [visualStatus, setVisualStatus] = useState("");
  const [filters, setFilters] = useState<MarketplaceFilters>({
    condition: "All", transactionType: "All", credibility: "All", pricingTier: "All",
  });
  const categories = ["All", ...new Set(listings.map((item) => item.category))];
  const results = useMemo(() => listings.filter((item) =>
    (category === "All" || item.category === category) &&
    (!visualIds || visualIds.includes(item.id)) &&
    listingMatches(item, query, filters)
  ), [category, query, filters, visualIds]);

  function setFilter(key: keyof MarketplaceFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function visualSearch(file?: File) {
    if (!file) return;
    setVisualStatus("Finding visually similar listings…");
    const form = new FormData();
    form.set("image", file);
    const response = await fetch("/api/search/visual", { method: "POST", body: form });
    if (!response.ok) {
      setVisualStatus("We could not read that photo. Try another JPG, PNG, or WebP.");
      return;
    }
    const data = await response.json() as { ids: string[]; explanation: string };
    setVisualIds(data.ids);
    setCategory("All");
    setVisualStatus(`${data.ids.length} similar listings · ${data.explanation}`);
  }

  return (
    <>
      <div className="search-row">
        <div style={{position:"relative",flex:1}}>
          <Search size={19} style={{position:"absolute",left:14,top:13,color:"var(--muted)"}}/>
          <input className="input" style={{paddingLeft:44}} value={query} onChange={(e)=>{setQuery(e.target.value);setVisualIds(null);setVisualStatus("")}} placeholder="Search in English or မြန်မာ Unicode…"/>
        </div>
        <label className="btn btn-quiet"><Camera size={17}/> Search by photo<input type="file" accept="image/*" hidden onChange={(event)=>visualSearch(event.target.files?.[0])}/></label>
        <button className="btn btn-quiet" onClick={()=>setShowFilters(!showFilters)}><SlidersHorizontal size={17}/> Filters</button>
      </div>
      {visualStatus && <div className="trust-banner" style={{marginTop:12}}><Camera size={19}/><span style={{flex:1}}>{visualStatus}</span>{visualIds&&<button className="btn btn-quiet" onClick={()=>{setVisualIds(null);setVisualStatus("")}} aria-label="Clear photo search"><X size={15}/></button>}</div>}
      {showFilters && <div className="card advanced-filters">
        <div className="field"><label htmlFor="condition-filter">Condition tier</label><select id="condition-filter" className="input" value={filters.condition} onChange={(e)=>setFilter("condition",e.target.value)}><option>All</option><option>Brand New</option><option>Like New</option><option>Lightly Used</option><option>Needs Repair/Upcycling</option></select></div>
        <div className="field"><label htmlFor="transaction-filter">Transaction type</label><select id="transaction-filter" className="input" value={filters.transactionType} onChange={(e)=>setFilter("transactionType",e.target.value)}><option>All</option><option>Escrow Delivery</option><option>SafeZone Locker Pickup</option><option>Direct Meetup</option><option>Free / Give-away</option></select></div>
        <div className="field"><label htmlFor="credibility-filter">Seller credibility</label><select id="credibility-filter" className="input" value={filters.credibility} onChange={(e)=>setFilter("credibility",e.target.value)}><option>All</option><option>Verified Neighbor</option><option>Top-Rated Sellers</option><option>High Response Rate (&lt;15 mins)</option></select></div>
        <div className="field"><label htmlFor="pricing-filter">Price & bargain</label><select id="pricing-filter" className="input" value={filters.pricingTier} onChange={(e)=>setFilter("pricingTier",e.target.value)}><option>All</option><option>Fixed Price</option><option>Open to Offers</option><option>Price Dropped Recently</option></select></div>
      </div>}
      <div className="filters">
        {categories.map((item) => <button key={item} className={`filter ${category===item?"active":""}`} onClick={()=>setCategory(item)}>{item}</button>)}
      </div>
      <div className="grid grid-3">
        {results.map((item) => (
          <Link href={`/marketplace/${item.id}`} className="card product" key={item.id}>
            <div style={{position:"relative"}}>
              <Image className="product-img" src={item.image} alt={item.title} width={700} height={520} loading={item.id==="iphone-13"?"eager":"lazy"}/>
              <span style={{position:"absolute",right:12,bottom:12}} className="badge">© {item.seller} · Aug 2026</span>
            </div>
            <div className="product-body">
              <div className="meta-row"><span>{item.condition}</span>{item.trial && <span className="badge">48h try</span>}</div>
              <h3 style={{margin:"10px 0 8px"}}>{item.title}</h3>
              <div className="price">{money(item.price)}</div>
              <div className="filters" style={{margin:"10px 0 0"}}><span className="badge">{item.transactionType}</span><span className={item.pricingTier==="Price Dropped Recently"?"badge badge-warn":"badge"}>{item.pricingTier}</span></div>
              <div className="meta-row" style={{marginTop:14}}>
                <span>{item.location}</span>
                <span>{item.verified && <ShieldCheck size={13} style={{display:"inline"}}/>} ★ {item.rating} · ~{item.responseMinutes}m</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!results.length && <div className="card" style={{textAlign:"center",padding:50}}><h3>No matching items</h3><p className="muted">Try another category or search term.</p></div>}
    </>
  );
}
