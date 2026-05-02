import { api } from './client';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ResetUserPasswordRequest,
} from '../types';

export const usersApi = {
  list: () => api.get<{ success: boolean; data: User[] } | User[]>('/users'),
  create: (data: CreateUserRequest) => api.post<{ success: boolean; data: User } | User>('/users', data),
  update: (id: string, data: UpdateUserRequest) =>
    api.patch<{ success: boolean; data: User } | User>(`/users/${id}`, data),
  resetPassword: (id: string, data: ResetUserPasswordRequest) =>
    api.post<void>(`/users/${id}/reset-password`, data),
  delete: (id: string) => api.delete<void>(`/users/${id}`),
};
