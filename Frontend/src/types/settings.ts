export type MaxRedeemMode = 'flat_amount' | 'percent_of_bill';
export type RedemptionMode = 'partial' | 'full_only';

export interface ShopSettings {
  shopId: string;
  // Rs. pointsPerAmount to earn 1 point
  pointsPerAmount: string;
  // 1 LKR discount per redemptionValue points
  redemptionValue: string;
  minRedeemPoints: number;
  maxRedeemMode: MaxRedeemMode;
  maxRedeemValue: string | null;
  redemptionMode: RedemptionMode;
  pointsExpiryMonths: number; // 0 = never expire
  expiryWarningDays: number;
  smsEnabled: boolean;
  textlkSenderId: string | null;
  textlkApiUrl: string | null;
  hasApiKey: boolean; // true if API key is stored (key hidden from response)
}

export interface UpdateShopSettingsRequest {
  pointsPerAmount?: number;
  redemptionValue?: number;
  minRedeemPoints?: number;
  maxRedeemMode?: MaxRedeemMode;
  maxRedeemValue?: number | null;
  redemptionMode?: RedemptionMode;
  pointsExpiryMonths?: number;
  expiryWarningDays?: number;
  smsEnabled?: boolean;
  textlkSenderId?: string;
  textlkApiKey?: string;
  textlkApiUrl?: string;
}
