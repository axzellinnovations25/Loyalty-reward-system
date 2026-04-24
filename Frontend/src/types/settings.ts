export type MaxRedeemMode = 'flat_amount' | 'percent_of_bill';

export interface ShopSettings {
  shopId: string;
  // Rs. pointsPerAmount to earn 1 point
  pointsPerAmount: string;
  // 1 LKR discount per redemptionValue points
  redemptionValue: string;
  minRedeemPoints: number;
  maxRedeemMode: MaxRedeemMode;
  pointsExpiryMonths: number; // 0 = never expire
  expiryWarningDays: number;
}

export interface UpdateShopSettingsRequest {
  pointsPerAmount?: number;
  redemptionValue?: number;
  minRedeemPoints?: number;
  maxRedeemMode?: MaxRedeemMode;
  pointsExpiryMonths?: number;
  expiryWarningDays?: number;
}
