import { AdminConsole } from "@/components/admin-console";

export default function AdminPage() {
  return <main className="page"><div className="eyebrow">Operations console · Admin only</div><h1 style={{fontSize:"clamp(40px,6vw,68px)"}}>Trust needs<br/>good operations.</h1><AdminConsole/></main>;
}
