export interface Redemption {
  id: string;
  shopId: string;
  customerId: string;
  userId: string;
  pointsRedeemed: number;
  discountValue: string; // Decimal serialised as string
  isVoided: boolean;
  createdAt: string;
}

export interface CreateRedemptionRequest {
  customerId: string;
  pointsToRedeem: number;
}

export interface RedemptionPreview {
  pointsToRedeem: number;
  discountValue: string;
  remainingPoints: number;
}
