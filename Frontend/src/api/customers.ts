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
    api.get<PaginatedResponse<Customer>>('/customers', params as Record<string, unknown>),
  get: (id: string) => api.get<Customer>(`/customers/${id}`),
  create: (data: CreateCustomerRequest) => api.post<Customer>('/customers', data),
  update: (id: string, data: UpdateCustomerRequest) =>
    api.patch<Customer>(`/customers/${id}`, data),
  delete: (id: string) => api.delete<void>(`/customers/${id}`),
  restore: (id: string) => api.post<Customer>(`/customers/${id}/restore`, {}),
};
