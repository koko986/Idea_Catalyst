"use client";

import { useActionState, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
  UserRoundCog,
} from "lucide-react";
import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

type LoginFormProps = {
  adminEmail: string;
  adminPassword: string;
};

export function LoginForm({
  adminEmail,
  adminPassword,
}: LoginFormProps) {
  const [mode, setMode] = useState<"member" | "admin">("member");
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="card login-card">
      <div className="iconbox">
        {mode === "admin" ? <UserRoundCog size={21} /> : <Mail size={21} />}
      </div>
      <h2 style={{ marginTop: 18 }}>Sign in to PyanThit</h2>
      <p className="muted">
        {mode === "member"
          ? "Use any made-up email address. No message is sent and no real inbox is needed."
          : "Use the single demo administrator account below."}
      </p>

      <span className="field-legend">Choose how you want to sign in</span>
      <div className="role-switch" role="tablist" aria-label="Account type">
        <button
          className={`role-option ${mode === "member" ? "active" : ""}`}
          type="button"
          role="tab"
          aria-selected={mode === "member"}
          onClick={() => setMode("member")}
        >
          <UserRound size={19} />
          <strong>User</strong>
          <span>Any email</span>
        </button>
        <button
          className={`role-option ${mode === "admin" ? "active" : ""}`}
          type="button"
          role="tab"
          aria-selected={mode === "admin"}
          onClick={() => setMode("admin")}
        >
          <UserRoundCog size={19} />
          <strong>Admin</strong>
          <span>Demo account</span>
        </button>
      </div>

      {mode === "admin" && (
        <div className="demo-credentials">
          <BadgeCheck size={20} />
          <div>
            <strong>Demo admin account</strong>
            <code>{adminEmail}</code>
            <code>{adminPassword}</code>
          </div>
        </div>
      )}

      <form action={formAction} className="field" style={{ marginTop: 18 }}>
        <input type="hidden" name="mode" value={mode} />
        <label htmlFor="email">Email address</label>
        <div className="input-with-icon">
          <Mail size={17} />
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={
              mode === "admin" ? adminEmail : "member@example.test"
            }
            key={mode}
            required
          />
        </div>

        {mode === "admin" && (
          <>
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <KeyRound size={17} />
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue={adminPassword}
                required
              />
            </div>
          </>
        )}

        {state.error && (
          <p className="form-error" role="alert" aria-live="polite">
            {state.error}
          </p>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={pending}
        >
          {pending
            ? "Signing in…"
            : mode === "admin"
              ? "Sign in as admin"
              : "Sign in as user"}
          {!pending && <ArrowRight size={16} />}
        </button>
      </form>

      <div className="mvp-note">
        <ShieldCheck size={18} />
        <span>MVP demo only — replace this flow before production.</span>
      </div>
    </div>
  );
}
