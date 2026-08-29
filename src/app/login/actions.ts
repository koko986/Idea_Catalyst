"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authenticate,
  createAccount,
  getAccountInitials,
  type Account,
} from "@/lib/auth/accounts";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";

export type LoginState = {
  error?: string;
};

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  mode: z.enum(["member", "admin"]),
});

const signUpSchema = z
  .object({
    email: z.email("Enter a valid email address."),
    displayName: z.string().trim().max(60).optional(),
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
      ),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Both passwords must match.",
    path: ["confirmPassword"],
  });

async function startSession(account: Account) {
  await createSession({
    userId: account.id,
    role: account.role,
    email: account.email,
    name: account.displayName,
    initials: getAccountInitials(account),
  });
}

function landingPath(account: Account) {
  return account.role === "admin" ? "/admin" : "/marketplace";
}

async function signIn(formData: FormData): Promise<LoginState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    mode: formData.get("mode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check your details." };
  }

  const { email, password, mode } = parsed.data;
  const account = await authenticate(email, password);

  if (!account) {
    return { error: "That email and password combination is not recognised." };
  }

  if (mode === "admin" && account.role !== "admin") {
    return { error: "This account does not have administrator access." };
  }

  await startSession(account);
  redirect(landingPath(account));
}

async function signUp(formData: FormData): Promise<LoginState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Check your account details.",
    };
  }

  const { email, password, displayName } = parsed.data;
  const result = await createAccount({ email, password, displayName });

  if ("error" in result) {
    return { error: result.error };
  }

  await startSession(result.account);
  redirect(landingPath(result.account));
}

export async function submitLogin(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  return formData.get("intent") === "signup"
    ? signUp(formData)
    : signIn(formData);
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
