import { api } from './client';
import type { CreateGiftCardRequest, GiftCard, PaginatedResponse, PaginationParams, UseGiftCardRequest } from '../types';

type ListGiftCardsParams = PaginationParams & {
  status?: string;
};

export const giftCardsApi = {
  list: (params?: ListGiftCardsParams) =>
    api.get<{ data?: PaginatedResponse<GiftCard> } | PaginatedResponse<GiftCard>>('/gift-cards', params as Record<string, unknown>),
  get: (id: string) => api.get<{ data?: GiftCard } | GiftCard>(`/gift-cards/${id}`),
  validate: (code: string) => api.get<{ data?: GiftCard } | GiftCard>(`/gift-cards/validate/${encodeURIComponent(code)}`),
  create: (data: CreateGiftCardRequest) => api.post<{ data?: GiftCard } | GiftCard>('/gift-cards', data),
  redeem: (data: UseGiftCardRequest) => api.post<{ data?: GiftCard } | GiftCard>('/gift-cards/redeem', data),
  delete: (id: string) => api.delete<void>(`/gift-cards/${id}`),
};
