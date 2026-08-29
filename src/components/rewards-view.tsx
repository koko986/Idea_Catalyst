"use client";

import { useState } from "react";
import { Bike, Coffee, Leaf, ShoppingBasket, Wrench } from "lucide-react";

const rewards = [
  ["Repair café service credit",650,Wrench,"Yangon Repair Hub"],
  ["Local café voucher",400,Coffee,"Green Cup"],
  ["Grocery reuse discount",900,ShoppingBasket,"City Mart partner"],
  ["Bicycle tune-up",1200,Bike,"Bike World"],
] as const;

export function RewardsView(){
  const [points,setPoints]=useState(1840);
  const [notice,setNotice]=useState("");
  function redeem(cost:number,title:string){if(cost>points){setNotice("Not enough points yet.");return;}setPoints(points-cost);setNotice(`${title} reserved. Partner confirmation is pending.`)}
  return <><div className="wallet-card"><Leaf size={28}/><div className="metric" style={{marginTop:16}}>{points.toLocaleString()} Eco-Points</div><p style={{opacity:.7}}>Non-cashable · earned from verified settled trades</p></div>
    {notice&&<div className="trust-banner" style={{marginTop:16}}>{notice}</div>}
    <section className="section"><div className="section-head"><div><div className="eyebrow">Partner rewards</div><h2>Make reuse go further</h2></div></div>
      <div className="grid grid-4">{rewards.map(([title,cost,Icon,partner])=><div className="card feature-card" key={title}><div className="iconbox"><Icon size={20}/></div><div><h3>{title}</h3><p className="muted">{partner}</p><button className="btn btn-primary" onClick={()=>redeem(cost,title)}>{cost} points</button></div></div>)}</div>
    </section>
    <section className="grid grid-3"><div className="card"><div className="metric">213 kg</div><div className="stat-label">Items kept in use</div></div><div className="card"><div className="metric">486 kg</div><div className="stat-label">Estimated CO₂e avoided</div></div><div className="card"><div className="metric">12</div><div className="stat-label">Successful reuse trades</div></div></section>
  </>;
}
