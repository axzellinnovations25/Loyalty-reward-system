import type { Product } from './product';
import type { Purchase } from './purchase';

export type PaymentTenderType = 'cash' | 'card' | 'gift_card' | 'store_credit' | 'qr' | 'bank_transfer' | 'split' | 'other';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'refunded' | 'voided' | 'failed';
export type ShiftStatus = 'open' | 'closed';
export type StockMovementType = 'sale' | 'refund' | 'return' | 'adjustment' | 'receiving' | 'waste' | 'transfer' | 'manual';
export type TaxCalculationMode = 'exclusive' | 'inclusive';
export type HeldOrderStatus = 'parked' | 'quote' | 'layaway' | 'tab' | 'converted' | 'cancelled';
export type KitchenTicketStatus = 'queued' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface PosPayment {
  id: string;
  shopId: string;
  purchaseId?: string | null;
  refundId?: string | null;
  shiftId?: string | null;
  userId: string;
  tenderType: PaymentTenderType;
  amount: string | number;
  reference?: string | null;
  status: PaymentStatus;
  terminalId?: string | null;
  createdAt: string;
  purchase?: Purchase;
}

export interface PosReceipt {
  id: string;
  shopId: string;
  purchaseId: string;
  receiptNumber: string;
  businessName?: string | null;
  businessTaxId?: string | null;
  subtotal: string | number;
  discountTotal: string | number;
  taxTotal: string | number;
  serviceCharge: string | number;
  total: string | number;
  reprintCount: number;
  createdAt: string;
  purchase?: Purchase;
}

export interface PosRefund {
  id: string;
  shopId: string;
  purchaseId: string;
  refundNumber?: string | null;
  method: string;
  reason: string;
  amount: string | number;
  status: string;
  createdAt: string;
  purchase?: Purchase;
  items?: Array<{ id: string; name: string; quantity: number; lineTotal: string | number }>;
}

export interface RegisterShift {
  id: string;
  shopId: string;
  userId: string;
  terminalId?: string | null;
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string | null;
  openingCash: string | number;
  cashIn: string | number;
  cashOut: string | number;
  expectedCash: string | number;
  closingCash?: string | number | null;
  variance?: string | number | null;
  note?: string | null;
  payments?: PosPayment[];
}

export interface StockMovement {
  id: string;
  productId?: string | null;
  variantId?: string | null;
  movementType: StockMovementType;
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string | null;
  createdAt: string;
  product?: Product;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplierId?: string | null;
  orderNumber: string;
  status: string;
  subtotal: string | number;
  createdAt: string;
  supplier?: Supplier;
  items?: Array<{ id: string; productId: string; quantityOrdered: number; quantityReceived: number; unitCost: string | number; product?: Product }>;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: string | number;
  mode: TaxCalculationMode;
  isDefault: boolean;
  isActive: boolean;
}

export interface HeldOrder {
  id: string;
  customerId?: string | null;
  status: HeldOrderStatus;
  label?: string | null;
  cart: unknown;
  subtotal: string | number;
  createdAt: string;
}

export interface PosTerminal {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  isActive: boolean;
}

export interface KitchenTicket {
  id: string;
  ticketNumber: string;
  status: KitchenTicketStatus;
  items: unknown;
  note?: string | null;
  createdAt: string;
}
