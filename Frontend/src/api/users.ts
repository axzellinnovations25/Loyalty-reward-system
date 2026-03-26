import { api } from './client';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ResetUserPasswordRequest,
} from '../types';

export const usersApi = {
  list: () => api.get<User[]>('/users'),
  create: (data: CreateUserRequest) => api.post<User>('/users', data),
  update: (id: string, data: UpdateUserRequest) =>
    api.patch<User>(`/users/${id}`, data),
  resetPassword: (id: string, data: ResetUserPasswordRequest) =>
    api.post<void>(`/users/${id}/reset-password`, data),
  delete: (id: string) => api.delete<void>(`/users/${id}`),
};
