import { api } from './client';
import type {
  Redemption,
  CreateRedemptionRequest,
  RedemptionPreview,
  PaginatedResponse,
  PaginationParams,
} from '../types';

export const redemptionsApi = {
  preview: (customerId: string, pointsToRedeem: number) =>
    api.get<RedemptionPreview>('/redemptions/preview', { customerId, pointsToRedeem }),
  list: (params?: PaginationParams & { customerId?: string }) =>
    api.get<PaginatedResponse<Redemption>>('/redemptions', params as Record<string, unknown>),
  create: (data: CreateRedemptionRequest) => api.post<Redemption>('/redemptions', data),
  void: (id: string) => api.post<Redemption>(`/redemptions/${id}/void`, {}),
};
