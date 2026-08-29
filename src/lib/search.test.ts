import { describe, expect, it } from "vitest";
import { listings } from "./data";
import { listingMatches, normalizeMarketplaceQuery } from "./search";

const all = { condition: "All", transactionType: "All", credibility: "All", pricingTier: "All" };

describe("bilingual marketplace search", () => {
  it("maps Myanmar Unicode and English to shared product intent", () => {
    expect(normalizeMarketplaceQuery("ဖုန်း ရှာမယ်")).toContain("phone");
    expect(listingMatches(listings[0], "ဖုန်း", all)).toBe(true);
    expect(listingMatches(listings[0], "smartphone", all)).toBe(true);
  });

  it("combines multi-attribute filters", () => {
    expect(listingMatches(listings[0], "", {
      condition: "Like New",
      transactionType: "SafeZone Locker Pickup",
      credibility: "High Response Rate (<15 mins)",
      pricingTier: "Open to Offers",
    })).toBe(true);
    expect(listingMatches(listings[3], "", { ...all, credibility: "Verified Neighbor" })).toBe(false);
  });
});
