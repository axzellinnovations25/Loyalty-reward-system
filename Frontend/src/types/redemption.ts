export interface Redemption {
  id: string;
  shopId: string;
  customerId: string;
  userId: string;
  pointsRedeemed: number;
  discountValue: string; // Decimal serialised as string
  isVoided: boolean;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface CreateRedemptionRequest {
  customerId: string;
  pointsRedeemed: number;
  billAmount: number;
  notes?: string;
}

export interface RedemptionPreview {
  pointsToRedeem: number;
  discountValue: string;
  remainingPoints: number;
  minRedeemPoints: number;
  maxRedeemMode: 'flat_amount' | 'percent_of_bill';
  redemptionValue: number;
}
