import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin-console";
import { getSession } from "@/lib/auth/session";

export default async function AdminPage() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/marketplace");

  return (
    <main className="page">
      <div className="eyebrow">Operations console · Admin only</div>
      <h1 style={{ fontSize: "clamp(40px,6vw,68px)" }}>
        Trust needs
        <br />
        good operations.
      </h1>
      <AdminConsole />
    </main>
  );
}
