import { api } from './client';
import type { ApiResponse, Customer, CreateCustomerRequest, PaginatedResponse, PaginationParams, UpdateCustomerRequest } from '../types';

type ListCustomersParams = PaginationParams & {
  search?: string;
  includeDeleted?: boolean;
};

export const customersApi = {
  list: (params?: ListCustomersParams) =>
    api.get<ApiResponse<PaginatedResponse<Customer>> | { success: boolean; data: PaginatedResponse<Customer> }>('/customers', params as Record<string, unknown>),
  get: (id: string) => api.get<ApiResponse<Customer>>(`/customers/${id}`),
  findByPhone: (phone: string) => api.get<ApiResponse<Customer>>(`/customers/phone/${encodeURIComponent(phone)}`),
  create: (data: CreateCustomerRequest) => api.post<ApiResponse<Customer>>('/customers', data),
  update: (id: string, data: UpdateCustomerRequest) => api.patch<ApiResponse<Customer>>(`/customers/${id}`, data),
  delete: (id: string) => api.delete<void>(`/customers/${id}`),
};

