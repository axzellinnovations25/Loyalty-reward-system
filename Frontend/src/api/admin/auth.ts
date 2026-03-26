import { adminApi } from '../client';
import type { LoginRequest, AdminLoginResponse } from '../../types';

export const adminAuthApi = {
  login: (data: LoginRequest) => adminApi.post<AdminLoginResponse>('/admin/auth/login', data),
  logout: () => adminApi.post<void>('/admin/auth/logout', {}),
};
