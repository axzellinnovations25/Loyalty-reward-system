export interface Purchase {
  id: string;
  shopId: string;
  customerId: string;
  userId: string;
  amount: string; // Decimal serialised as string
  pointsEarned: number;
  pointsRedeemed: number; // annotated by repository from linked Redemption row
  isVoided: boolean;
  voidedBy: string | null;
  voidedAt: string | null;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface CreatePurchaseRequest {
  customerId: string;
  amount: number;
}
