import { adminApi } from '../client';
import type {
  Shop,
  CreateShopRequest,
  UpdateShopRequest,
  AssignPlanRequest,
  AssignTrialRequest,
  PaginatedResponse,
  PaginationParams,
} from '../../types';

export const adminShopsApi = {
  list: (params?: PaginationParams & { search?: string; isActive?: boolean }) =>
    adminApi.get<PaginatedResponse<Shop>>('/admin/shops', params as Record<string, unknown>),
  get: (id: string) => adminApi.get<Shop>(`/admin/shops/${id}`),
  create: (data: CreateShopRequest) => adminApi.post<Shop>('/admin/shops', data),
  update: (id: string, data: UpdateShopRequest) =>
    adminApi.patch<Shop>(`/admin/shops/${id}`, data),
  assignPlan: (id: string, data: AssignPlanRequest) =>
    adminApi.post<Shop>(`/admin/shops/${id}/plan`, data),
  assignTrial: (id: string, data: AssignTrialRequest) =>
    adminApi.post<Shop>(`/admin/shops/${id}/trial`, data),
};
