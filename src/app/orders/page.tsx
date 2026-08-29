import { OrderView } from "@/components/order-view";

export default function OrdersPage() {
  return <main className="page"><div className="eyebrow">Protected order</div><h1 style={{fontSize:"clamp(40px,6vw,68px)"}}>Inspect first.<br/>Confirm second.</h1><OrderView/></main>;
}
