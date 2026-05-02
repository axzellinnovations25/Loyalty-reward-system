export interface Purchase {
  id: string;
  shopId: string;
  customerId: string;
  userId: string;
  subtotal?: string; // Decimal serialised as string
  discountTotal?: string; // Decimal serialised as string
  taxTotal?: string;
  serviceCharge?: string;
  amount: string; // Decimal serialised as string
  pointsEarned: number;
  pointsRedeemed: number; // annotated by repository from linked Redemption row
  discountValue?: number;  // annotated by repository from linked Redemption row
  isVoided: boolean;
  receiptNumber?: string | null;
  paymentStatus?: string;
  shiftId?: string | null;
  terminalId?: string | null;
  voidedBy: string | null;
  voidedAt: string | null;
  createdAt: string;
  items?: Array<{
    id: string;
    purchaseId: string;
    productId?: string | null;
    variantId?: string | null;
    name: string;
    sku?: string | null;
    originalUnitPrice?: string | null;
    unitPrice: string;
    discountAmount?: string;
    taxRate?: string | null;
    taxAmount?: string;
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
  payments?: Array<{
    id: string;
    tenderType: string;
    amount: string;
    reference?: string | null;
    status: string;
  }>;
  receipts?: Array<{
    id: string;
    receiptNumber: string;
    reprintCount: number;
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
    variantId?: string | null;
    name: string;
    sku?: string | null;
    unitPrice: number;
    quantity: number;
    taxRate?: number | null;
    taxMode?: 'exclusive' | 'inclusive' | null;
    modifiers?: Array<Record<string, unknown>>;
  }>;
  payments?: Array<{
    tenderType: string;
    amount: number;
    reference?: string | null;
    status?: string;
    terminalId?: string | null;
    metadata?: Record<string, unknown> | null;
  }>;
  paymentMethod?: string;
  paidAmount?: number;
  terminalId?: string | null;
  shiftId?: string | null;
  heldOrderId?: string | null;
  serviceCharge?: number;
  businessTaxId?: string | null;
  receiptTemplateVersion?: string | null;
  createKitchenTicket?: boolean;
  kitchenNote?: string | null;
}
