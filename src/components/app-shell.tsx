import Link from "next/link";
import { Home, MessageCircle, Package, Plus, ShieldCheck, Wallet } from "lucide-react";

const links = [
  ["Marketplace", "/marketplace"],
  ["Sell", "/sell"],
  ["Offers", "/offers"],
  ["Chat", "/chat"],
  ["Orders", "/orders"],
  ["Wallet", "/wallet"],
  ["Trust", "/trust"],
  ["Admin", "/admin"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="ReTrust home">
          <span className="brandmark"><ShieldCheck size={19} /></span>
          ReTrust
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <Link href="/profile" className="avatar" aria-label="Open profile">KT</Link>
      </header>
      {children}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <Link href="/"><Home size={19}/><span>Home</span></Link>
        <Link href="/marketplace"><Package size={19}/><span>Shop</span></Link>
        <Link href="/sell"><Plus size={19}/><span>Sell</span></Link>
        <Link href="/chat"><MessageCircle size={19}/><span>Chat</span></Link>
        <Link href="/wallet"><Wallet size={19}/><span>Wallet</span></Link>
      </nav>
    </div>
  );
}
