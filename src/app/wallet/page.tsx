import { WalletView } from "@/components/wallet-view";

export default function WalletPage() {
  return <main className="page"><div className="eyebrow">Protected wallet</div><h1 style={{fontSize:"clamp(40px,6vw,68px)"}}>Your balance,<br/>accounted for.</h1><WalletView/></main>;
}
