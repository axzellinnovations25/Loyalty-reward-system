export interface Purchase {
  id: string;
  shopId: string;
  customerId: string;
  userId: string;
  amount: string; // Decimal serialised as string
  pointsEarned: number;
  isVoided: boolean;
  voidedBy: string | null;
  voidedAt: string | null;
  createdAt: string;
}

export interface CreatePurchaseRequest {
  customerId: string;
  amount: number;
}
