import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin-console";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  if (supabase) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) redirect("/login");
    const { data: role } = await supabase.from("user_roles").select("role")
      .eq("user_id", authData.user.id).in("role", ["moderator", "admin"]).maybeSingle();
    if (!role) redirect("/");
  }
  return <main className="page"><div className="eyebrow">Operations console · Admin only</div><h1 style={{fontSize:"clamp(40px,6vw,68px)"}}>Trust needs<br/>good operations.</h1><AdminConsole/></main>;
}
