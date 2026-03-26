export type MaxRedeemMode = 'flat_amount' | 'percent_of_bill';
export type RedemptionMode = 'partial' | 'full_only';

export interface ShopSettings {
  shopId: string;
  // Spend this many LKR to earn 1 point
  pointsPerAmount: string;
  // This many points = 1 LKR discount
  redemptionValue: string;
  minRedeemPoints: number;
  maxRedeemMode: MaxRedeemMode;
  maxRedeemValue: string | null;
  redemptionMode: RedemptionMode;
  pointsExpiryMonths: number; // 0 = never expire
  expiryWarningDays: number;
  smsEnabled: boolean;
  textlkSenderId: string | null;
  textlkApiKey: string | null; // masked on read
  textlkApiUrl: string | null;
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
