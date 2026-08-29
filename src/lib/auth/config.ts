import "server-only";

export const DEMO_ADMIN_EMAIL =
  process.env.MVP_ADMIN_EMAIL?.trim().toLowerCase() || "admin@retrust.demo";

export const DEMO_ADMIN_PASSWORD =
  process.env.MVP_ADMIN_PASSWORD || "Admin123!";

export const MVP_SESSION_SECRET =
  process.env.MVP_SESSION_SECRET ||
  "retrust-mvp-demo-session-secret-change-before-production";

export function getDemoAdminCredentials() {
  return {
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
  };
}
