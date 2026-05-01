export type MaxRedeemMode = 'flat_amount' | 'percent_of_bill';

export type ShopSettings = {
  shopId: string;
  pointsPerAmount: string;
  redemptionValue: string;
  minRedeemPoints: number;
  maxRedeemMode: MaxRedeemMode;
  pointsExpiryMonths: number;
  expiryWarningDays: number;
};

export type UpdateShopSettingsRequest = {
  pointsPerAmount?: number;
  redemptionValue?: number;
  minRedeemPoints?: number;
  maxRedeemMode?: MaxRedeemMode;
  pointsExpiryMonths?: number;
  expiryWarningDays?: number;
};
