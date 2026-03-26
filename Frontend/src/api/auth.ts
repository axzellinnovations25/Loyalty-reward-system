import { api } from './client';
import type { LoginRequest, LoginResponse, ChangePasswordRequest } from '../types';

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  logout: () => api.post<void>('/auth/logout', {}),
  changePassword: (data: ChangePasswordRequest) =>
    api.post<void>('/auth/change-password', data),
};
