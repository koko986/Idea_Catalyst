"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "@/lib/auth/config";
import { createSession, deleteSession } from "@/lib/auth/session";
import type { SessionRole } from "@/lib/auth/token";

export type LoginState = {
  error?: string;
};

const loginSchema = z.object({
  email: z.email("Enter a valid email address.").transform((value) =>
    value.trim().toLowerCase(),
  ),
  mode: z.enum(["member", "admin"]),
  password: z.string().optional(),
});

function matchesSecret(value: string, expected: string) {
  const supplied = Buffer.from(value);
  const configured = Buffer.from(expected);
  return (
    supplied.length === configured.length &&
    timingSafeEqual(supplied, configured)
  );
}

function getInitials(email: string, role: SessionRole) {
  if (role === "admin") return "AD";

  const localPart = email.split("@")[0] || "member";
  const chunks = localPart.split(/[._-]+/).filter(Boolean);
  const letters =
    chunks.length > 1
      ? `${chunks[0][0]}${chunks[1][0]}`
      : localPart.slice(0, 2);
  return letters.toUpperCase();
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password") || undefined,
    mode: formData.get("mode"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Check your login details.",
    };
  }

  const { email, mode, password = "" } = parsed.data;
  let role: SessionRole = "member";

  if (mode === "admin") {
    if (
      email !== DEMO_ADMIN_EMAIL ||
      !matchesSecret(password, DEMO_ADMIN_PASSWORD)
    ) {
      return { error: "The admin email or password is incorrect." };
    }
    role = "admin";
  } else if (email === DEMO_ADMIN_EMAIL) {
    return { error: "Use the Admin tab for the admin account." };
  }

  const userId = createHash("sha256").update(email).digest("hex");
  await createSession({
    userId,
    role,
    initials: getInitials(email, role),
  });

  redirect(role === "admin" ? "/admin" : "/marketplace");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
