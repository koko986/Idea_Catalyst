import Link from "next/link";
import Image from "next/image";
import {
  Home,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  Wallet,
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { getSession } from "@/lib/auth/session";

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

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const visibleLinks = links.filter(
    ([label]) => label !== "Admin" || session?.role === "admin",
  );

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="PyanThit home">
          <Image
            className="brandmark"
            src="/pyanthit-icon.png"
            alt=""
            width={40}
            height={40}
            priority
          />
          PyanThit
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {session &&
            visibleLinks.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
        </nav>
        {session ? (
          <div className="account-actions">
            <Link href="/profile" className="avatar" aria-label="Open profile">
              {session.initials}
            </Link>
            <form action={logout}>
              <button className="icon-button" type="submit" aria-label="Sign out">
                <LogOut size={17} />
              </button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="btn btn-quiet">
            Sign in
          </Link>
        )}
      </header>
      {children}
      {session && (
        <nav className="bottom-nav" aria-label="Mobile navigation">
          <Link href="/">
            <Home size={19} />
            <span>Home</span>
          </Link>
          <Link href="/marketplace">
            <Package size={19} />
            <span>Shop</span>
          </Link>
          <Link href="/sell">
            <Plus size={19} />
            <span>Sell</span>
          </Link>
          <Link href="/chat">
            <MessageCircle size={19} />
            <span>Chat</span>
          </Link>
          <Link href="/wallet">
            <Wallet size={19} />
            <span>Wallet</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
