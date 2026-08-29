import { RewardsView } from "@/components/rewards-view";

export default function RewardsPage(){
  return <main className="page"><div className="eyebrow">Reuse rewards</div><h1 style={{fontSize:"clamp(40px,6vw,68px)"}}>Trade lighter.<br/>Live greener.</h1><RewardsView/></main>;
}
