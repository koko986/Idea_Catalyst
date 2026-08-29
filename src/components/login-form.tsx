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
import { submitLogin, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

type Credentials = {
  email: string;
  password: string;
};

type LoginFormProps = {
  admin: Credentials;
  user: Credentials;
  minPasswordLength: number;
};

type Mode = "member" | "admin";
type Intent = "signin" | "signup";

export function LoginForm({ admin, user, minPasswordLength }: LoginFormProps) {
  const [mode, setMode] = useState<Mode>("member");
  const [intent, setIntent] = useState<Intent>("signin");
  const [state, formAction, pending] = useActionState(
    submitLogin,
    initialState,
  );
  const [dismissed, setDismissed] = useState<LoginState | null>(null);

  const error = state === dismissed ? undefined : state.error;
  const creatingAccount = mode === "member" && intent === "signup";
  const demo = mode === "admin" ? admin : user;

  function selectMode(next: Mode) {
    setDismissed(state);
    setIntent("signin");
    setMode(next);
  }

  function selectIntent(next: Intent) {
    setDismissed(state);
    setIntent(next);
  }

  return (
    <div className="card login-card">
      <div className="iconbox">
        {mode === "admin" ? <UserRoundCog size={21} /> : <UserRound size={21} />}
      </div>
      <h2 style={{ marginTop: 18 }}>
        {creatingAccount ? "Create your account" : "Sign in to PyanThit"}
      </h2>
      <p className="muted">
        {mode === "admin"
          ? "Administrator accounts open the operations console."
          : creatingAccount
            ? "Your email and password are stored as a real account you can sign back into."
            : "Sign in with an account you created, or use the demo account below."}
      </p>

      <span className="field-legend">Choose how you want to sign in</span>
      <div className="role-switch" role="tablist" aria-label="Account type">
        <button
          className={`role-option ${mode === "member" ? "active" : ""}`}
          type="button"
          role="tab"
          aria-selected={mode === "member"}
          onClick={() => selectMode("member")}
        >
          <UserRound size={19} />
          <strong>User</strong>
          <span>Shop and sell</span>
        </button>
        <button
          className={`role-option ${mode === "admin" ? "active" : ""}`}
          type="button"
          role="tab"
          aria-selected={mode === "admin"}
          onClick={() => selectMode("admin")}
        >
          <UserRoundCog size={19} />
          <strong>Admin</strong>
          <span>Operations console</span>
        </button>
      </div>

      {mode === "member" && (
        <div className="intent-switch">
          <button
            className={`intent-option ${intent === "signin" ? "active" : ""}`}
            type="button"
            onClick={() => selectIntent("signin")}
          >
            I have an account
          </button>
          <button
            className={`intent-option ${intent === "signup" ? "active" : ""}`}
            type="button"
            onClick={() => selectIntent("signup")}
          >
            Create an account
          </button>
        </div>
      )}

      {!creatingAccount && (
        <div className="demo-credentials">
          <BadgeCheck size={20} />
          <div>
            <strong>
              {mode === "admin" ? "Demo admin account" : "Demo user account"}
            </strong>
            <code>{demo.email}</code>
            <code>{demo.password}</code>
          </div>
        </div>
      )}

      <form action={formAction} className="field" style={{ marginTop: 18 }}>
        <input type="hidden" name="mode" value={mode} />
        <input
          type="hidden"
          name="intent"
          value={creatingAccount ? "signup" : "signin"}
        />

        {creatingAccount && (
          <>
            <label htmlFor="displayName">Display name</label>
            <input
              className="input"
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              placeholder="How other people see you"
            />
          </>
        )}

        <label htmlFor="email">Email address</label>
        <div className="input-with-icon">
          <Mail size={17} />
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={creatingAccount ? "" : demo.email}
            key={`email-${mode}-${intent}`}
            required
          />
        </div>

        <label htmlFor="password">Password</label>
        <div className="input-with-icon">
          <KeyRound size={17} />
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            autoComplete={creatingAccount ? "new-password" : "current-password"}
            minLength={creatingAccount ? minPasswordLength : undefined}
            defaultValue={creatingAccount ? "" : demo.password}
            key={`password-${mode}-${intent}`}
            required
          />
        </div>

        {creatingAccount && (
          <>
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="input-with-icon">
              <KeyRound size={17} />
              <input
                className="input"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={minPasswordLength}
                required
              />
            </div>
            <span className="muted" style={{ fontSize: 12 }}>
              At least {minPasswordLength} characters.
            </span>
          </>
        )}

        {error && (
          <p className="form-error" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending
            ? "Working…"
            : creatingAccount
              ? "Create account"
              : mode === "admin"
                ? "Sign in as admin"
                : "Sign in as user"}
          {!pending && <ArrowRight size={16} />}
        </button>
      </form>

      <div className="mvp-note">
        <ShieldCheck size={18} />
        <span>
          Demo accounts are stored locally and email addresses are not verified.
        </span>
      </div>
    </div>
  );
}
