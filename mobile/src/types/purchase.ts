export type Purchase = {
  id: string;
  shopId: string;
  customerId: string;
  userId: string;
  amount: string;
  pointsEarned: number;
  pointsRedeemed: number;
  discountValue?: number;
  isVoided: boolean;
  voidedBy: string | null;
  voidedAt: string | null;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
};

export type CreatePurchaseRequest = {
  customerId: string;
  amount: number;
};
