import "server-only";

import { normalizeEmail } from "@/lib/auth/password";

export const DEMO_ADMIN_EMAIL = normalizeEmail(
  process.env.MVP_ADMIN_EMAIL || "admin@pyanthit.demo",
);

export const DEMO_ADMIN_PASSWORD =
  process.env.MVP_ADMIN_PASSWORD || "Admin123!";

export const DEMO_USER_EMAIL = normalizeEmail(
  process.env.MVP_USER_EMAIL || "user@pyanthit.demo",
);

export const DEMO_USER_PASSWORD = process.env.MVP_USER_PASSWORD || "User123!";

export const MVP_SESSION_SECRET =
  process.env.MVP_SESSION_SECRET ||
  "retrust-mvp-demo-session-secret-change-before-production";

export function getDemoCredentials() {
  return {
    admin: { email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD },
    user: { email: DEMO_USER_EMAIL, password: DEMO_USER_PASSWORD },
  };
}
