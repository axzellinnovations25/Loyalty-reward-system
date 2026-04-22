import { api } from './client';
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  PaginatedResponse,
  PaginationParams,
} from '../types';

interface ListCustomersParams extends PaginationParams {
  search?: string;
  includeDeleted?: boolean;
}

export const customersApi = {
  list: (params?: ListCustomersParams) =>
    api.get<{ success: boolean; data: PaginatedResponse<Customer> }>('/customers', params as Record<string, unknown>),
  get: (id: string) =>
    api.get<{ success: boolean; data: Customer }>(`/customers/${id}`),
  findByPhone: (phone: string) =>
    api.get<{ success: boolean; data: Customer }>(`/customers/phone/${encodeURIComponent(phone)}`),
  create: (data: CreateCustomerRequest) =>
    api.post<{ success: boolean; data: Customer }>('/customers', data),
  update: (id: string, data: UpdateCustomerRequest) =>
    api.patch<{ success: boolean; data: Customer }>(`/customers/${id}`, data),
  delete: (id: string) =>
    api.delete<void>(`/customers/${id}`),
};
