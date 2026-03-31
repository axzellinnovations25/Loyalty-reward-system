import { adminApi } from '../client';
import type { User, CreateUserRequest, PaginatedResponse, PaginationParams } from '../../types';

export const adminUsersApi = {
  list: (params?: PaginationParams & { search?: string; shopId?: string; isActive?: boolean }) =>
    adminApi.get<PaginatedResponse<User>>('/admin/users', params as Record<string, unknown>),
  get: (id: string) => adminApi.get<User>(`/admin/users/${id}`),
  create: (data: CreateUserRequest & { shopId: string }) => adminApi.post<User>('/admin/users', data),
  update: (id: string, data: Partial<CreateUserRequest> & { isActive?: boolean }) =>
    adminApi.patch<User>(`/admin/users/${id}`, data),
};
