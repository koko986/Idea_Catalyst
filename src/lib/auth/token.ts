import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { MVP_SESSION_SECRET } from "@/lib/auth/config";

export const SESSION_COOKIE = "pyanthit_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = "admin" | "member";

export type Session = {
  userId: string;
  role: SessionRole;
  email: string;
  name: string;
  initials: string;
};

const key = new TextEncoder().encode(MVP_SESSION_SECRET);

export async function createSessionToken(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(key);
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.userId !== "string" ||
      (payload.role !== "admin" && payload.role !== "member") ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.initials !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      name: payload.name,
      initials: payload.initials,
    };
  } catch {
    return null;
  }
}
