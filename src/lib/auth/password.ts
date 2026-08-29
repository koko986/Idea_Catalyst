import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SCHEME = "scrypt";

export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(
    password.normalize("NFKC"),
    salt,
    KEY_LENGTH,
  )) as Buffer;
  return `${SCHEME}:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== SCHEME || !salt || !hash) return false;

  const derived = (await scrypt(
    password.normalize("NFKC"),
    salt,
    KEY_LENGTH,
  )) as Buffer;
  const expected = Buffer.from(hash, "hex");

  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}

export function getInitials(source: string) {
  const base = source.includes("@") ? source.split("@")[0] : source;
  const chunks = base.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const letters =
    chunks.length > 1
      ? `${chunks[0][0]}${chunks[1][0]}`
      : (chunks[0] || base).slice(0, 2);
  return letters.toUpperCase() || "PT";
}
