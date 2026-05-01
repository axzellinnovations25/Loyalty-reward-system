import { api } from './client';
import type { CreatePurchaseRequest, PaginatedResponse, PaginationParams, Purchase } from '../types';

type ListPurchasesParams = PaginationParams & {
  customerId?: string;
};

export const purchasesApi = {
  list: (params?: ListPurchasesParams) =>
    api.get<{ data?: PaginatedResponse<Purchase> } | PaginatedResponse<Purchase>>('/purchases', params as Record<string, unknown>),
  create: (data: CreatePurchaseRequest) => api.post<{ data?: Purchase } | Purchase>('/purchases', data),
  void: (id: string) => api.post<{ data?: Purchase } | Purchase>(`/purchases/${id}/void`, {}),
};

