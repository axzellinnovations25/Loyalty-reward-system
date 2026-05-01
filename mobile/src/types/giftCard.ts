export type GiftCardStatus = 'active' | 'used' | 'expired';

export type GiftCard = {
  id: string;
  code: string;
  value: string | number;
  status: GiftCardStatus;
  expiryDate?: string | null;
  createdAt: string;
  qrCodeImage?: string;
};

export type CreateGiftCardRequest = {
  value: number;
  expiryDate?: string | null;
};

export type UseGiftCardRequest = {
  code: string;
};

