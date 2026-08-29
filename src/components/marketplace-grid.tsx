"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { listings, money } from "@/lib/data";

export function MarketplaceGrid() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const categories = ["All", ...new Set(listings.map((item) => item.category))];
  const results = useMemo(() => listings.filter((item) =>
    (category === "All" || item.category === category) &&
    item.title.toLowerCase().includes(query.toLowerCase())
  ), [category, query]);

  return (
    <>
      <div style={{position:"relative",maxWidth:600}}>
        <Search size={19} style={{position:"absolute",left:14,top:13,color:"var(--muted)"}}/>
        <input className="input" style={{paddingLeft:44}} value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search verified second-hand goods"/>
      </div>
      <div className="filters">
        {categories.map((item) => <button key={item} className={`filter ${category===item?"active":""}`} onClick={()=>setCategory(item)}>{item}</button>)}
      </div>
      <div className="grid grid-3">
        {results.map((item) => (
          <Link href={`/marketplace/${item.id}`} className="card product" key={item.id}>
            <div style={{position:"relative"}}>
              <Image className="product-img" src={item.image} alt={item.title} width={700} height={520}/>
              <span style={{position:"absolute",right:12,bottom:12}} className="badge">© {item.seller} · Aug 2026</span>
            </div>
            <div className="product-body">
              <div className="meta-row"><span>{item.condition}</span>{item.trial && <span className="badge">48h try</span>}</div>
              <h3 style={{margin:"10px 0 8px"}}>{item.title}</h3>
              <div className="price">{money(item.price)}</div>
              <div className="meta-row" style={{marginTop:14}}>
                <span>{item.location}</span>
                <span>{item.verified && <ShieldCheck size={13} style={{display:"inline"}}/>} ★ {item.rating}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!results.length && <div className="card" style={{textAlign:"center",padding:50}}><h3>No matching items</h3><p className="muted">Try another category or search term.</p></div>}
    </>
  );
}
