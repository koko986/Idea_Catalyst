import { describe, expect, it } from "vitest";
import { cancelSelection, confirmSelectedBuyer, counterOffer, expireSelection, selectBuyer, type Negotiation } from "./offers";

function negotiation(): Negotiation {
  return {
    listingId: "listing-1", selectedOfferId: null, confirmationDeadline: null, round: 0,
    offers: [
      { id: "a", buyerName: "A", amountMmk: 100, message: "", status: "active", responseMinutes: 5 },
      { id: "b", buyerName: "B", amountMmk: 120, message: "", status: "active", responseMinutes: 10 },
    ],
  };
}

describe("multi-buyer negotiation", () => {
  it("supports seller counters and discounts", () => {
    const raised = counterOffer(negotiation(), "a", 130);
    expect(raised.offers[0]).toMatchObject({ amountMmk: 130, status: "countered" });
    expect(counterOffer(raised, "a", 90).offers[0].amountMmk).toBe(90);
  });

  it("selects one buyer and waits the others", () => {
    const selected = selectBuyer(negotiation(), "b", 1_000);
    expect(selected.selectedOfferId).toBe("b");
    expect(selected.confirmationDeadline).toBe(1_000 + 86_400_000);
    expect(selected.offers.map((offer) => offer.status)).toEqual(["waiting", "selected"]);
  });

  it("confirms only the chosen buyer during 24 hours", () => {
    const selected = selectBuyer(negotiation(), "b", 1_000);
    expect(confirmSelectedBuyer(selected, "b", 2_000).offers.map((offer) => offer.status)).toEqual(["declined", "confirmed"]);
    expect(() => confirmSelectedBuyer(selected, "a", 2_000)).toThrow("Only the selected buyer");
  });

  it("returns waiting buyers to available after expiry", () => {
    const selected = selectBuyer(negotiation(), "a", 1_000);
    const expired = expireSelection(selected, 86_401_001);
    expect(expired.selectedOfferId).toBeNull();
    expect(expired.offers.map((offer) => offer.status)).toEqual(["expired", "active"]);
    expect(selectBuyer(expired, "b", 90_000_000).selectedOfferId).toBe("b");
  });

  it.each(["buyer", "seller"] as const)("allows %s cancellation and reopens waiting offers", (actor) => {
    const selected = selectBuyer(negotiation(), "a", 1_000);
    const cancelled = cancelSelection(selected, actor);
    expect(cancelled.offers.map((offer) => offer.status)).toEqual(["cancelled", "active"]);
    expect(cancelled.offers[0].message).toContain(`Cancelled by ${actor}`);
  });
});
