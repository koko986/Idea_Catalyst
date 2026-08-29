export type OfferStatus = "active" | "countered" | "selected" | "waiting" | "confirmed" | "declined" | "expired" | "cancelled";

export type BuyerOffer = {
  id: string;
  buyerName: string;
  amountMmk: number;
  message: string;
  status: OfferStatus;
  responseMinutes: number;
};

export type Negotiation = {
  listingId: string;
  selectedOfferId: string | null;
  confirmationDeadline: number | null;
  round: number;
  offers: BuyerOffer[];
};

function editable(offer: BuyerOffer) {
  return ["active", "countered", "waiting"].includes(offer.status);
}

export function counterOffer(state: Negotiation, offerId: string, amountMmk: number): Negotiation {
  if (!Number.isSafeInteger(amountMmk) || amountMmk < 0) throw new Error("Counter price must be a non-negative MMK integer");
  const offer = state.offers.find((item) => item.id === offerId);
  if (!offer || !editable(offer)) throw new Error("Offer cannot be countered");
  return {
    ...state,
    offers: state.offers.map((item) => item.id === offerId ? { ...item, amountMmk, status: "countered" } : item),
  };
}

export function selectBuyer(state: Negotiation, offerId: string, now = Date.now()): Negotiation {
  if (state.selectedOfferId) throw new Error("Release the current selection before choosing another buyer");
  const selected = state.offers.find((offer) => offer.id === offerId);
  if (!selected || !editable(selected)) throw new Error("Buyer offer is not available");
  return {
    ...state,
    selectedOfferId: offerId,
    confirmationDeadline: now + 24 * 60 * 60 * 1000,
    round: state.round + 1,
    offers: state.offers.map((offer) => ({
      ...offer,
      status: offer.id === offerId ? "selected" : editable(offer) ? "waiting" : offer.status,
    })),
  };
}

export function confirmSelectedBuyer(state: Negotiation, offerId: string, now = Date.now()): Negotiation {
  if (state.selectedOfferId !== offerId) throw new Error("Only the selected buyer can confirm");
  if (!state.confirmationDeadline || now >= state.confirmationDeadline) throw new Error("The 24-hour confirmation window expired");
  return {
    ...state,
    offers: state.offers.map((offer) => ({
      ...offer,
      status: offer.id === offerId ? "confirmed" : offer.status === "waiting" ? "declined" : offer.status,
    })),
  };
}

export function expireSelection(state: Negotiation, now = Date.now()): Negotiation {
  if (!state.selectedOfferId || !state.confirmationDeadline || now < state.confirmationDeadline) return state;
  const expiredId = state.selectedOfferId;
  return {
    ...state,
    selectedOfferId: null,
    confirmationDeadline: null,
    offers: state.offers.map((offer) => ({
      ...offer,
      status: offer.id === expiredId ? "expired" : offer.status === "waiting" ? "active" : offer.status,
    })),
  };
}

export function cancelSelection(state: Negotiation, actor: "buyer" | "seller"): Negotiation {
  if (!state.selectedOfferId) throw new Error("There is no selected transaction to cancel");
  const cancelledId = state.selectedOfferId;
  return {
    ...state,
    selectedOfferId: null,
    confirmationDeadline: null,
    offers: state.offers.map((offer) => ({
      ...offer,
      status: offer.id === cancelledId ? "cancelled" : offer.status === "waiting" ? "active" : offer.status,
      message: offer.id === cancelledId ? `${offer.message} · Cancelled by ${actor}` : offer.message,
    })),
  };
}
