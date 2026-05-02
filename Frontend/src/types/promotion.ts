export type PromotionKind =
  | 'cart_percent'
  | 'cart_amount'
  | 'item_percent'
  | 'item_amount'
  | 'bogo'
  | 'happy_hour_price';

export interface Promotion {
  id: string;
  shopId: string;
  name: string;
  description?: string | null;
  kind: PromotionKind;
  isActive: boolean;
  priority: number;
  stackable: boolean;
  startAt?: string | null;
  endAt?: string | null;
  daysOfWeek: number[];
  startTime?: string | null;
  endTime?: string | null;
  couponCode?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  usedCount: number;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PromotionPreviewRequest {
  customerId?: string | null;
  couponCode?: string | null;
  at?: string;
  items: Array<{
    productId?: string | null;
    name: string;
    sku?: string | null;
    unitPrice: number;
    quantity: number;
  }>;
}

export interface PromotionPreviewResult {
  subtotal: number;
  itemDiscountTotal: number;
  cartDiscount: number;
  discountTotal: number;
  total: number;
  applied: Array<{
    promotionId: string;
    name: string;
    kind: PromotionKind;
    discountAmount: number;
    details?: Record<string, unknown>;
  }>;
}

