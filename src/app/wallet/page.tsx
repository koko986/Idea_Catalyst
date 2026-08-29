import { WalletView } from "@/components/wallet-view";

export default async function WalletPage({ searchParams }: { searchParams: Promise<{ amount?: string }> }) {
  const requested = Number((await searchParams).amount ?? 0);
  const suggestedAmount = Number.isSafeInteger(requested) && requested > 0 ? requested : 0;
  return <main className="page"><div className="eyebrow">Protected wallet</div><h1 style={{fontSize:"clamp(40px,6vw,68px)"}}>Your balance,<br/>accounted for.</h1><WalletView suggestedAmount={suggestedAmount}/></main>;
}
