"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Gift,
  Home,
  Menu,
  MessageCircle,
  Package,
  Plus,
  ShieldCheck,
  Tag,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { useConversations } from "@/components/use-conversations";

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

const primaryLinks = [
  ["Marketplace", "/marketplace"],
  ["Sell", "/sell"],
  ["Offers", "/offers"],
  ["Orders", "/orders"],
  ["Wallet", "/wallet"],
  ["Trust", "/trust"],
  ["Admin", "/admin"],
];

const sideLinks = [
  [MessageCircle, "Chat", "/chat"],
  [Tag, "Offers", "/offers"],
  [Package, "Orders", "/orders"],
  [Wallet, "Wallet", "/wallet"],
  [Gift, "Rewards", "/rewards"],
  [ShieldCheck, "Trust", "/trust"],
  [UserRound, "Admin", "/admin"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const conversations = useConversations();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPath(null);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <button className="menu-toggle" type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpenPath(pathname)}>
            <Menu size={22}/>
          </button>
          <Link href="/" className="brand" aria-label="PyanThit home">
            <Image
              className="brandmark"
              src="/icons/icon-192.png"
              alt=""
              width={40}
              height={40}
              priority
            />
            PyanThit
          </Link>
        </div>
        <nav className="nav" aria-label="Primary navigation">
          {primaryLinks.map(([label, href]) => (
            <Link key={href} href={href} className={isActivePath(pathname, href) ? "active" : undefined} aria-current={isActivePath(pathname, href) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/profile" className="avatar" aria-label="Open profile">KT</Link>
      </header>
      {open && (
        <>
          <button className="drawer-backdrop" type="button" aria-label="Close menu" onClick={() => setOpenPath(null)}/>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Side menu">
            <div className="drawer-head">
              <Link href="/profile" className="drawer-profile" onClick={() => setOpenPath(null)}>
                <span className="avatar" style={{width:52,height:52}}>KT</span>
                <span>
                  <strong>Kyaw Thu</strong>
                  <span className="muted" style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>
                    <BadgeCheck size={14}/> View profile
                  </span>
                </span>
              </Link>
              <button className="menu-toggle" type="button" aria-label="Close menu" onClick={() => setOpenPath(null)}>
                <X size={20}/>
              </button>
            </div>
            <nav className="drawer-nav" aria-label="Side menu">
              {sideLinks.map(([Icon, label, href]) => (
                <Link key={href + label} href={href} className={pathname === href || pathname.startsWith(`${href}/`) ? "active" : undefined} onClick={() => setOpenPath(null)}>
                  <Icon size={18}/>
                  <span>{label}</span>
                  {label === "Chat" && conversations.length > 0 && (
                    <span className="menu-count">{conversations.length}</span>
                  )}
                </Link>
              ))}
            </nav>
          </aside>
        </>
      )}
      {children}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {([
          [Home, "Home", "/"],
          [Package, "Shop", "/marketplace"],
          [Plus, "Sell", "/sell"],
          [Wallet, "Wallet", "/wallet"],
          [UserRound, "Account", "/profile"],
        ] as const).map(([Icon, label, href]) => (
          <Link key={href} href={href} className={`${isActivePath(pathname, href) ? "active" : ""} ${href === "/sell" ? "bottom-nav-primary" : ""}`} aria-current={isActivePath(pathname, href) ? "page" : undefined}>
            <Icon size={20}/>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
