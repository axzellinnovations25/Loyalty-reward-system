export type GiftCardStatus = 'active' | 'used' | 'expired';

export interface GiftCard {
  id: string;
  shopId: string;
  code: string;
  value: string; // Decimal serialised as string
  status: GiftCardStatus;
  expiryDate: string | null; // ISO date string (date only)
  usedAt: string | null;
  usedBy: string | null;
  createdBy: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface CreateGiftCardRequest {
  value: number;
  expiryDate?: string; // ISO date string
}

export interface UseGiftCardRequest {
  code: string;
}
