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
  items?: Array<{
    id: string;
    purchaseId: string;
    productId?: string | null;
    name: string;
    sku?: string | null;
    unitPrice: string;
    quantity: number;
    lineTotal: string;
  }>;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
};

export type CreatePurchaseRequest = {
  customerId: string;
  amount?: number;
  items?: Array<{
    productId?: string | null;
    name: string;
    sku?: string | null;
    unitPrice: number;
    quantity: number;
  }>;
};
