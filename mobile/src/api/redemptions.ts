import { api } from './client';
import type { CreateRedemptionRequest, PaginatedResponse, PaginationParams, Redemption, RedemptionPreview } from '../types';

export const redemptionsApi = {
  list: (params?: ListRedemptionsParams) =>
    api.get<{ data?: PaginatedResponse<Redemption> } | PaginatedResponse<Redemption>>('/redemptions', params as Record<string, unknown>),
  preview: (customerId: string, pointsToRedeem: number) =>
    api.get<{ data?: RedemptionPreview } | RedemptionPreview>(`/redemptions/preview`, { customerId, pointsToRedeem }),
  create: (data: CreateRedemptionRequest) => api.post<{ data?: Redemption } | Redemption>('/redemptions', data),
  void: (id: string) => api.post<{ data?: Redemption } | Redemption>(`/redemptions/${id}/void`, {}),
};

type ListRedemptionsParams = PaginationParams & {
  customerId?: string;
};
