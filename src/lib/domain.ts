import { createHmac, timingSafeEqual } from "node:crypto";

export type Account = "user_available" | "order_escrow" | "platform_clearing" | "platform_fee";
export type Posting = { account: Account; amount: number };
export type JournalEntry = {
  id: string;
  kind: "top_up" | "hold" | "release" | "refund" | "fee" | "reversal";
  reference: string;
  createdAt: string;
  postings: Posting[];
};

export function createEntry(input: Omit<JournalEntry, "createdAt"> & { createdAt?: string }): JournalEntry {
  if (!input.id.trim() || !input.reference.trim()) throw new Error("Entry identity and reference are required");
  if (input.postings.length < 2) throw new Error("A journal entry needs at least two postings");
  const total = input.postings.reduce((sum, posting) => sum + posting.amount, 0);
  if (!input.postings.every((posting) => Number.isSafeInteger(posting.amount))) {
    throw new Error("Money must use integer minor units");
  }
  if (total !== 0) throw new Error("Journal entry is not balanced");
  return { ...input, createdAt: input.createdAt ?? new Date().toISOString() };
}

export type OrderStatus =
  | "funded" | "escrow_held" | "shipped" | "delivered" | "inspecting"
  | "trial_active" | "confirmed" | "return_review" | "disputed" | "released" | "refunded" | "cancelled";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  funded: ["escrow_held", "refunded", "cancelled"],
  escrow_held: ["shipped", "refunded", "disputed", "cancelled"],
  shipped: ["delivered", "disputed"],
  delivered: ["inspecting", "disputed"],
  inspecting: ["trial_active", "confirmed", "disputed"],
  trial_active: ["confirmed", "return_review", "disputed"],
  confirmed: ["released", "disputed"],
  return_review: ["refunded", "disputed"],
  disputed: ["released", "refunded"],
  released: [],
  refunded: [],
  cancelled: [],
};

export function transitionOrder(current: OrderStatus, next: OrderStatus) {
  if (!transitions[current].includes(next)) throw new Error(`Invalid order transition: ${current} → ${next}`);
  return next;
}

export function calculateTrust(input: {
  completed: number;
  successful: number;
  cancelled: number;
  rating: number;
  identityVerified: boolean;
  phoneVerified: boolean;
}) {
  const deliveryRate = input.completed ? Math.round((input.successful / input.completed) * 100) : 0;
  const cancellationRate = input.completed ? Math.round((input.cancelled / input.completed) * 100) : 0;
  const powerSeller = input.identityVerified && input.completed >= 50 && deliveryRate >= 95 && input.rating >= 4.5;
  return { deliveryRate, cancellationRate, powerSeller };
}

export function imeiIsValid(value: string) {
  if (!/^\d{15}$/.test(value)) return false;
  const digits = value.split("").map(Number);
  const sum = digits.slice(0, 14).reduce((total, digit, index) => {
    if (index % 2 === 1) {
      const doubled = digit * 2;
      return total + Math.floor(doubled / 10) + (doubled % 10);
    }
    return total + digit;
  }, 0);
  return (10 - (sum % 10)) % 10 === digits[14];
}

const blockedPatterns = [
  /https?:\/\/|www\./i,
  /\b(?:09|\+?95)\s?\d(?:[\s-]?\d){7,9}\b/,
  /\b(kpay|wave\s?pay|aya\s?pay).{0,24}(send|transfer|account|number)\b/i,
  /\b(pay|talk|chat|deal).{0,20}(outside|facebook|telegram|viber)\b/i,
];

export function inspectChat(text: string) {
  const match = blockedPatterns.find((pattern) => pattern.test(text));
  return match
    ? { allowed: false, risk: "high" as const, reason: "Possible off-platform contact, link, or payment request" }
    : { allowed: true, risk: "low" as const, reason: null };
}

type HandoverPayload = { orderId: string; actor: "buyer" | "seller"; expiresAt: number; nonce: string };

export function signHandoverToken(payload: HandoverPayload, secret: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyHandoverToken(token: string, secret: string, now = Date.now()): HandoverPayload {
  const [body, provided] = token.split(".");
  if (!body || !provided) throw new Error("Malformed handover token");
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid handover signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as HandoverPayload;
  if (payload.expiresAt <= now) throw new Error("Handover token expired");
  return payload;
}

export function coarseLocation(name: string, radiusMeters: number) {
  const safeRadius = Math.max(500, Math.ceil(radiusMeters / 500) * 500);
  return `Within ${safeRadius >= 1000 ? `${safeRadius / 1000} km` : `${safeRadius} m`} of ${name}`;
}

export function ecoPoints(weightKg: number, categoryFactor: number) {
  return Math.max(0, Math.round(weightKg * categoryFactor * 10));
}
