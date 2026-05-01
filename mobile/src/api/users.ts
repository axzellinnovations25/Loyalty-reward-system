import { api } from './client';
import type { CreateUserRequest, ResetUserPasswordRequest, UpdateUserRequest, User } from '../types';

export const usersApi = {
  list: () => api.get<{ data?: User[] } | User[]>('/users'),
  create: (data: CreateUserRequest) => api.post<{ data?: User } | User>('/users', data),
  update: (id: string, data: UpdateUserRequest) => api.patch<{ data?: User } | User>(`/users/${id}`, data),
  resetPassword: (id: string, data: ResetUserPasswordRequest) => api.post<void>(`/users/${id}/reset-password`, data),
  delete: (id: string) => api.delete<void>(`/users/${id}`),
};
