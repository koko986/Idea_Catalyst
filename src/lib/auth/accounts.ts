import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
} from "@/lib/auth/config";
import {
  getInitials,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth/password";
import type { SessionRole } from "@/lib/auth/token";

export type Account = {
  id: string;
  email: string;
  displayName: string;
  role: SessionRole;
  passwordHash: string;
  createdAt: string;
};

export type CreateAccountResult = { account: Account } | { error: string };

// Serverless hosts (Netlify, Vercel, Lambda) ship a read-only bundle, so the
// repository directory cannot be written to. Only the temp dir is writable
// there, which keeps the seeded accounts usable per instance.
function resolveStoreFile() {
  if (process.env.MVP_ACCOUNTS_FILE) {
    return path.resolve(process.env.MVP_ACCOUNTS_FILE);
  }

  const readOnlyBundle = Boolean(
    process.env.NETLIFY ||
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT,
  );

  return readOnlyBundle
    ? path.join(tmpdir(), "pyanthit-accounts.json")
    : path.join(process.cwd(), ".data", "accounts.json");
}

let storeFile = resolveStoreFile();
const fallbackStoreFile = path.join(tmpdir(), "pyanthit-accounts.json");

const demoAccounts = [
  {
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    displayName: "Demo administrator",
    role: "admin" as SessionRole,
  },
  {
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
    displayName: "Demo user",
    role: "member" as SessionRole,
  },
];

// The JSON store is read-modify-write, so every access is queued to keep
// concurrent sign-ups from dropping each other's writes.
let pending: Promise<unknown> = Promise.resolve();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation, operation);
  pending = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function readAll(): Promise<Account[]> {
  try {
    const contents = await readFile(storeFile, "utf8");
    const parsed = JSON.parse(contents) as { accounts?: Account[] };
    return Array.isArray(parsed.accounts) ? parsed.accounts : [];
  } catch {
    return [];
  }
}

async function writeTo(target: string, accounts: Account[]) {
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${randomBytes(6).toString("hex")}`;
  await writeFile(
    temporary,
    `${JSON.stringify({ accounts }, null, 2)}\n`,
    "utf8",
  );
  await rename(temporary, target);
}

async function writeAll(accounts: Account[]) {
  try {
    await writeTo(storeFile, accounts);
  } catch (error) {
    // A read-only or missing mount should not break sign-in entirely.
    if (storeFile === fallbackStoreFile) throw error;
    storeFile = fallbackStoreFile;
    await writeTo(storeFile, accounts);
  }
}

// Runs on every load so a missing or hand-edited store heals itself instead of
// leaving the demo accounts unusable until restart.
async function loadSeededAccounts(): Promise<Account[]> {
  const accounts = await readAll();
  let changed = false;

  for (const demo of demoAccounts) {
    const email = normalizeEmail(demo.email);
    const existing = accounts.find((account) => account.email === email);

    if (!existing) {
      accounts.push({
        id: randomUUID(),
        email,
        displayName: demo.displayName,
        role: demo.role,
        passwordHash: await hashPassword(demo.password),
        createdAt: new Date().toISOString(),
      });
      changed = true;
    } else if (existing.role !== demo.role) {
      existing.role = demo.role;
      changed = true;
    }
  }

  if (changed) await writeAll(accounts);
  return accounts;
}

let decoyHash: Promise<string> | null = null;

// Hashing an unusable password for unknown emails keeps the response time of a
// wrong email close to that of a wrong password.
function getDecoyHash() {
  decoyHash ??= hashPassword(randomBytes(32).toString("hex"));
  return decoyHash;
}

export async function createAccount(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<CreateAccountResult> {
  const email = normalizeEmail(input.email);

  return serialize(async () => {
    const accounts = await loadSeededAccounts();

    if (accounts.some((account) => account.email === email)) {
      return {
        error: "An account with this email already exists. Sign in instead.",
      };
    }

    const account: Account = {
      id: randomUUID(),
      email,
      displayName: input.displayName?.trim() || email.split("@")[0],
      role: "member",
      passwordHash: await hashPassword(input.password),
      createdAt: new Date().toISOString(),
    };

    accounts.push(account);
    await writeAll(accounts);
    return { account };
  });
}

export async function authenticate(email: string, password: string) {
  const normalized = normalizeEmail(email);
  const accounts = await serialize(loadSeededAccounts);
  const account = accounts.find((entry) => entry.email === normalized);

  if (!account) {
    await verifyPassword(password, await getDecoyHash());
    return null;
  }

  return (await verifyPassword(password, account.passwordHash))
    ? account
    : null;
}

export async function getAccountById(id: string) {
  const accounts = await serialize(loadSeededAccounts);
  return accounts.find((account) => account.id === id) ?? null;
}

export function getAccountInitials(account: Account) {
  return getInitials(account.displayName || account.email);
}
