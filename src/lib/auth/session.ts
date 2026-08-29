import "server-only";

import { cookies } from "next/headers";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  type Session,
  verifySessionToken,
} from "@/lib/auth/token";

export async function createSession(session: Session) {
  const cookieStore = await cookies();
  const token = await createSessionToken(session);

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
