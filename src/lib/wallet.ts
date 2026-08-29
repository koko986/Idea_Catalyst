import { z } from "zod";

export const transferMethods = ["bank_transfer", "kpay", "wavepay", "aya_pay"] as const;

export const topUpInputSchema = z.object({
  amountMmk: z.coerce.number().int().min(1_000).max(100_000_000),
  transferMethod: z.enum(transferMethods),
  transferReference: z.string().trim().min(4).max(80),
});

export const checkoutInputSchema = z.object({
  listingId: z.string().trim().min(1).max(100),
  trialMode: z.boolean().default(false),
  offerId: z.uuid().nullable().optional(),
});

export type WalletSnapshot = {
  availableMmk: number;
  heldMmk: number;
  requests: Array<{
    id: string;
    requestNumber: string;
    amountMmk: number;
    transferMethod: string;
    transferReference: string;
    status: "pending" | "approved" | "rejected" | "cancelled";
    rejectionReason: string | null;
    createdAt: string;
  }>;
  activity: Array<{
    id: string;
    label: string;
    amountMmk: number;
    note: string;
  }>;
};

export const demoWallet: WalletSnapshot = {
  availableMmk: 4_200_000,
  heldMmk: 1_480_000,
  requests: [],
  activity: [
    { id: "hold-2048", label: "Escrow hold · RT-2048", amountMmk: -1_480_000, note: "Today · protected" },
    { id: "top-up-8812", label: "Admin-assisted top-up · TP-8812", amountMmk: 3_000_000, note: "Aug 27 · reference verified" },
    { id: "release-1987", label: "Sale released · RT-1987", amountMmk: 620_000, note: "Aug 22 · dual confirmed" },
    { id: "refund-1931", label: "Refund · RT-1931", amountMmk: 280_000, note: "Aug 18 · dispute resolved" },
  ],
};

const databaseErrors: Record<string, { status: number; message: string }> = {
  admin_required: { status: 403, message: "Administrator access is required" },
  top_up_not_found: { status: 404, message: "Top-up request was not found" },
  top_up_already_reviewed: { status: 409, message: "This top-up request has already been reviewed" },
  rejection_reason_required: { status: 400, message: "A rejection reason is required" },
  authentication_required: { status: 401, message: "Authentication required" },
  listing_not_found: { status: 404, message: "Listing not found" },
  listing_not_available: { status: 409, message: "This listing is no longer available" },
  listing_not_reserved: { status: 409, message: "This offer is no longer reserved" },
  confirmed_offer_required: { status: 409, message: "A confirmed offer is required" },
  cannot_buy_own_listing: { status: 403, message: "You cannot buy your own listing" },
  trial_not_available: { status: 400, message: "Trial protection is unavailable for this listing" },
  insufficient_balance: { status: 409, message: "Your wallet balance is insufficient" },
};

export function walletDatabaseError(message: string) {
  const key = Object.keys(databaseErrors).find((candidate) => message.includes(candidate));
  return key ? databaseErrors[key] : { status: 409, message: "The wallet operation could not be completed" };
}

export function topUpStatusLabel(status: WalletSnapshot["requests"][number]["status"]) {
  return {
    pending: "Pending review",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  }[status];
}
