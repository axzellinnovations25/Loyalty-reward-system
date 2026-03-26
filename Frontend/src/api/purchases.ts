import { api } from './client';
import type {
  Purchase,
  CreatePurchaseRequest,
  PaginatedResponse,
  PaginationParams,
} from '../types';

interface ListPurchasesParams extends PaginationParams {
  customerId?: string;
}

export const purchasesApi = {
  list: (params?: ListPurchasesParams) =>
    api.get<PaginatedResponse<Purchase>>('/purchases', params as Record<string, unknown>),
  create: (data: CreatePurchaseRequest) => api.post<Purchase>('/purchases', data),
  void: (id: string) => api.post<Purchase>(`/purchases/${id}/void`, {}),
};
