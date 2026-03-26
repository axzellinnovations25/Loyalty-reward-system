import { adminApi } from '../client';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface BillingPayment {
  id: string;
  shopId: string;
  planId: string;
  amount: string;
  periodMonth: number;
  periodYear: number;
  paidOn: string;
  recordedBy: string;
  notes: string | null;
  createdAt: string;
}

export interface RecordPaymentRequest {
  shopId: string;
  planId: string;
  amount: number;
  periodMonth: number;
  periodYear: number;
  paidOn: string;
  notes?: string;
}

export const adminBillingApi = {
  list: (params?: PaginationParams & { shopId?: string }) =>
    adminApi.get<PaginatedResponse<BillingPayment>>(
      '/admin/billing',
      params as Record<string, unknown>,
    ),
  record: (data: RecordPaymentRequest) =>
    adminApi.post<BillingPayment>('/admin/billing', data),
};
