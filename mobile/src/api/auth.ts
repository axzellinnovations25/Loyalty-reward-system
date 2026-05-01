import { api } from './client';
import type { ChangePasswordRequest, LoginRequest, LoginResponse, AuthUser } from '../types';

export const authApi = {
  login: (data: LoginRequest) => api.post<{ data: LoginResponse } | LoginResponse>('/auth/login', data),
  me: () => api.get<{ data: AuthUser } | AuthUser>('/auth/me'),
  logout: () => api.post<void>('/auth/logout', {}),
  changePassword: (data: ChangePasswordRequest) => api.post<void>('/auth/change-password', data),
};
