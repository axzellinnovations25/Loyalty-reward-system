import { api } from './client';
import type {
  GiftCard,
  GiftCardStatus,
  CreateGiftCardRequest,
  UseGiftCardRequest,
  PaginatedResponse,
  PaginationParams,
} from '../types';

interface ListGiftCardsParams extends PaginationParams {
  status?: GiftCardStatus;
}

export const giftCardsApi = {
  list: (params?: ListGiftCardsParams) =>
    api.get<PaginatedResponse<GiftCard>>('/gift-cards', params as Record<string, unknown>),
  get: (id: string) => api.get<GiftCard>(`/gift-cards/${id}`),
  validate: (code: string) => api.get<GiftCard>(`/gift-cards/validate/${code}`),
  create: (data: CreateGiftCardRequest) => api.post<GiftCard>('/gift-cards', data),
  redeem: (data: UseGiftCardRequest) => api.post<GiftCard>('/gift-cards/redeem', data),
  delete: (id: string) => api.delete<void>(`/gift-cards/${id}`),
};
