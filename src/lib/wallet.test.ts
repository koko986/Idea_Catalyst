import { describe, expect, it } from "vitest";
import { checkoutInputSchema, topUpInputSchema, topUpStatusLabel, walletDatabaseError } from "./wallet";

describe("wallet funding validation", () => {
  it("accepts integer MMK funding details", () => {
    expect(topUpInputSchema.parse({
      amountMmk: "500000",
      transferMethod: "kpay",
      transferReference: "KP-482916",
    })).toEqual({
      amountMmk: 500000,
      transferMethod: "kpay",
      transferReference: "KP-482916",
    });
  });

  it.each([999, 100_000_001, 1_500.5])("rejects unsafe amount %s", (amountMmk) => {
    expect(topUpInputSchema.safeParse({
      amountMmk,
      transferMethod: "bank_transfer",
      transferReference: "BANK-1234",
    }).success).toBe(false);
  });

  it("validates checkout input without trusting a browser price", () => {
    expect(checkoutInputSchema.parse({ listingId: "iphone-13", trialMode: true })).toEqual({
      listingId: "iphone-13",
      trialMode: true,
    });
    expect(checkoutInputSchema.safeParse({ listingId: "", price: 1 }).success).toBe(false);
  });
});

describe("wallet responses", () => {
  it("maps database invariants to safe client messages", () => {
    expect(walletDatabaseError("insufficient_balance").status).toBe(409);
    expect(walletDatabaseError("admin_required").status).toBe(403);
    expect(walletDatabaseError("internal connection detail")).toEqual({
      status: 409,
      message: "The wallet operation could not be completed",
    });
  });

  it("labels every top-up state", () => {
    expect(topUpStatusLabel("pending")).toBe("Pending review");
    expect(topUpStatusLabel("approved")).toBe("Approved");
    expect(topUpStatusLabel("rejected")).toBe("Rejected");
    expect(topUpStatusLabel("cancelled")).toBe("Cancelled");
  });
});
