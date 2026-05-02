import { api } from './client';
import type { Promotion, PromotionPreviewRequest, PromotionPreviewResult } from '../types';

export const promotionsApi = {
  list: () => api.get<Promotion[]>('/promotions'),
  get: (id: string) => api.get<Promotion>(`/promotions/${id}`),
  create: (data: Omit<Promotion, 'id' | 'shopId' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'usedCount'>) =>
    api.post<Promotion>('/promotions', data as unknown as Record<string, unknown>),
  update: (id: string, data: Partial<Promotion>) => api.put<Promotion>(`/promotions/${id}`, data as unknown as Record<string, unknown>),
  remove: (id: string) => api.delete<Promotion>(`/promotions/${id}`),
  preview: (data: PromotionPreviewRequest) => api.post<PromotionPreviewResult>('/promotions/preview', data as unknown as Record<string, unknown>),
};
