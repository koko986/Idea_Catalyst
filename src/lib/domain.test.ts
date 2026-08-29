import { describe, expect, it } from "vitest";
import {
  calculateTrust,
  coarseLocation,
  createEntry,
  ecoPoints,
  imeiIsValid,
  inspectChat,
  signHandoverToken,
  transitionOrder,
  verifyHandoverToken,
} from "./domain";

describe("double-entry wallet", () => {
  it("accepts balanced integer postings", () => {
    const entry = createEntry({
      id: "topup-1", kind: "top_up", reference: "TP-1",
      postings: [{ account: "platform_clearing", amount: -500_000 }, { account: "buyer_available", amount: 500_000 }],
    });
    expect(entry.postings.reduce((sum, item) => sum + item.amount, 0)).toBe(0);
  });
  it("rejects unbalanced entries", () => {
    expect(() => createEntry({
      id: "bad", kind: "hold", reference: "H-1",
      postings: [{ account: "buyer_available", amount: -100 }, { account: "buyer_held", amount: 99 }],
    })).toThrow("not balanced");
  });
});

describe("order state machine", () => {
  it("supports protected happy path", () => {
    let status = transitionOrder("funded", "escrow_held");
    status = transitionOrder(status, "shipped");
    status = transitionOrder(status, "delivered");
    status = transitionOrder(status, "inspecting");
    status = transitionOrder(status, "confirmed");
    expect(transitionOrder(status, "released")).toBe("released");
  });
  it("prevents skipping inspection", () => {
    expect(() => transitionOrder("escrow_held", "released")).toThrow("Invalid");
  });
});

describe("trust and safety", () => {
  it("derives Power Seller from history", () => {
    expect(calculateTrust({ completed: 250, successful: 245, cancelled: 5, rating: 4.8, identityVerified: true, phoneVerified: true }))
      .toEqual({ deliveryRate: 98, cancellationRate: 2, powerSeller: true });
  });
  it("blocks links, contacts, and off-platform payments", () => {
    expect(inspectChat("Visit https://bad.example").allowed).toBe(false);
    expect(inspectChat("send it to my KPay account").allowed).toBe(false);
    expect(inspectChat("Is the battery health still 91%?").allowed).toBe(true);
  });
  it("validates IMEI Luhn checksums", () => {
    expect(imeiIsValid("490154203237518")).toBe(true);
    expect(imeiIsValid("490154203237519")).toBe(false);
  });
});

describe("handover and impact", () => {
  it("signs, verifies, and expires handover tokens", () => {
    const payload = { orderId: "order-1", actor: "buyer" as const, expiresAt: 2_000, nonce: "once" };
    const token = signHandoverToken(payload, "secret");
    expect(verifyHandoverToken(token, "secret", 1_000)).toEqual(payload);
    expect(() => verifyHandoverToken(token, "secret", 2_001)).toThrow("expired");
  });
  it("never exposes a radius below 500m", () => {
    expect(coarseLocation("Junction City", 50)).toBe("Within 500 m of Junction City");
  });
  it("awards deterministic non-cashable points", () => {
    expect(ecoPoints(12.4, 1.5)).toBe(186);
  });
});
