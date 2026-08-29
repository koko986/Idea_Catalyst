import type { Listing } from "./data";

export type MarketplaceFilters = {
  condition: string;
  transactionType: string;
  credibility: string;
  pricingTier: string;
};

const bilingualTerms: Record<string, string[]> = {
  phone: ["phone", "smartphone", "iphone", "ဖုန်း", "စမတ်ဖုန်း", "အိုင်ဖုန်း"],
  camera: ["camera", "photo", "fujifilm", "ကင်မရာ", "ဓာတ်ပုံ"],
  computer: ["computer", "laptop", "macbook", "ကွန်ပျူတာ", "လက်ပ်တော့", "မက်ဘုတ်"],
  chair: ["chair", "furniture", "home", "ကုလားထိုင်", "ပရိဘောဂ", "အိမ်"],
  bicycle: ["bike", "bicycle", "cycle", "စက်ဘီး", "အားကစား"],
  speaker: ["speaker", "audio", "music", "စပီကာ", "အသံ", "တေးဂီတ"],
};

export function normalizeMarketplaceQuery(query: string) {
  const normalized = query.normalize("NFKC").trim().toLocaleLowerCase();
  const mapped = Object.entries(bilingualTerms)
    .filter(([, aliases]) => aliases.some((alias) => normalized.includes(alias)))
    .map(([canonical]) => canonical);
  return [...new Set([normalized, ...mapped])].filter(Boolean);
}

export function listingMatches(listing: Listing, query: string, filters: MarketplaceFilters) {
  const terms = normalizeMarketplaceQuery(query);
  const haystack = [
    listing.title,
    listing.category,
    listing.condition,
    listing.seller,
    ...listing.keywordsMm,
  ].join(" ").normalize("NFKC").toLocaleLowerCase();
  const queryMatch = terms.length === 0 || terms.some((term) => haystack.includes(term) ||
    Object.values(bilingualTerms).some((aliases) => aliases.includes(term) && aliases.some((alias) => haystack.includes(alias))));
  const credibilityMatch =
    filters.credibility === "All" ||
    (filters.credibility === "Verified Neighbor" && listing.verified) ||
    (filters.credibility === "Top-Rated Sellers" && listing.topRated) ||
    (filters.credibility === "High Response Rate (<15 mins)" && listing.responseMinutes < 15);
  return queryMatch &&
    (filters.condition === "All" || listing.condition === filters.condition) &&
    (filters.transactionType === "All" || listing.transactionType === filters.transactionType) &&
    (filters.pricingTier === "All" || listing.pricingTier === filters.pricingTier) &&
    credibilityMatch;
}
