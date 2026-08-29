import { LoginForm } from "@/components/login-form";
import { getDemoCredentials } from "@/lib/auth/config";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";

export default function LoginPage() {
  const demo = getDemoCredentials();

  return (
    <main className="page login-page">
      <div className="eyebrow" style={{ textAlign: "center" }}>
        Account access
      </div>
      <LoginForm
        admin={demo.admin}
        user={demo.user}
        minPasswordLength={MIN_PASSWORD_LENGTH}
      />
    </main>
  );
}
