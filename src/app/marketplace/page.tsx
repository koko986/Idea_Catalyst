import type { Metadata } from "next";
import { MarketplaceGrid } from "@/components/marketplace-grid";

export const metadata: Metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return (
    <main className="page">
      <div className="eyebrow">Verified listings</div>
      <h1 style={{fontSize:"clamp(40px,6vw,68px)",marginBottom:18}}>Find your next<br/>good thing.</h1>
      <MarketplaceGrid/>
    </main>
  );
}
