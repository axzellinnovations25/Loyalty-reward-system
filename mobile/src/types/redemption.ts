export type Redemption = {
  id: string;
  shopId: string;
  customerId: string;
  userId: string;
  pointsRedeemed: number;
  discountValue: string;
  createdAt: string;
  isVoided: boolean;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
};

export type RedemptionPreview = {
  pointsToRedeem: number;
  discountValue: string;
  remainingPoints: number;
  minRedeemPoints: number;
  maxRedeemMode: 'flat_amount' | 'percent_of_bill';
  redemptionValue: number;
};

export type CreateRedemptionRequest = {
  customerId: string;
  pointsRedeemed: number;
  billAmount: number;
  notes?: string;
};
