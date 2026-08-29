export type ProviderResult = {
  status: "verified" | "flagged" | "manual_review";
  provider: string;
  reference: string;
  reason?: string;
};

export interface ImeiRegistry {
  check(imei: string): Promise<ProviderResult>;
}

export interface LockerProvider {
  reserve(input: { orderId: string; area: string }): Promise<{ externalId: string; label: string }>;
  release(input: { externalId: string; token: string }): Promise<ProviderResult>;
}

export interface RewardPartner {
  reserve(input: { userId: string; rewardId: string; points: number }): Promise<ProviderResult>;
}

export const adminImeiRegistry: ImeiRegistry = {
  async check(imei) {
    return { status: "manual_review", provider: "admin-fallback", reference: `IMEI-${imei.slice(-4)}`, reason: "No approved live registry configured" };
  },
};

export const adminLockerProvider: LockerProvider = {
  async reserve({ orderId, area }) {
    return { externalId: `LOCK-${orderId}`, label: `${area} · admin-assigned counter` };
  },
  async release({ externalId }) {
    return { status: "manual_review", provider: "admin-fallback", reference: externalId, reason: "Operator must confirm counter release" };
  },
};

export const adminRewardPartner: RewardPartner = {
  async reserve({ rewardId }) {
    return { status: "manual_review", provider: "admin-fallback", reference: rewardId, reason: "Partner redemption awaits operator settlement" };
  },
};
