export interface Purchase {
  id: string;
  shopId: string;
  customerId: string;
  userId: string;
  subtotal?: string; // Decimal serialised as string
  discountTotal?: string; // Decimal serialised as string
  amount: string; // Decimal serialised as string
  pointsEarned: number;
  pointsRedeemed: number; // annotated by repository from linked Redemption row
  discountValue?: number;  // annotated by repository from linked Redemption row
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
    originalUnitPrice?: string | null;
    unitPrice: string;
    discountAmount?: string;
    finalUnitPrice?: string | null;
    quantity: number;
    lineTotal: string;
  }>;
  promotions?: Array<{
    id: string;
    purchaseId: string;
    promotionId?: string | null;
    nameSnapshot: string;
    kindSnapshot: string;
    couponCode?: string | null;
    discountAmount: string;
    createdAt: string;
  }>;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface CreatePurchaseRequest {
  customerId: string;
  amount?: number;
  couponCode?: string | null;
  managerPassword?: string | null;
  items?: Array<{
    productId?: string | null;
    name: string;
    sku?: string | null;
    unitPrice: number;
    quantity: number;
  }>;
}
