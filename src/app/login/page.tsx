import { LoginForm } from "@/components/login-form";
import { getDemoAdminCredentials } from "@/lib/auth/config";

export default function LoginPage() {
  const admin = getDemoAdminCredentials();

  return (
    <main className="page login-page">
      <div className="eyebrow" style={{ textAlign: "center" }}>
        MVP demo access
      </div>
      <LoginForm
        adminEmail={admin.email}
        adminPassword={admin.password}
      />
    </main>
  );
}
