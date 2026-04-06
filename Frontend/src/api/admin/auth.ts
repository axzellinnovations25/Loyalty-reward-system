import { adminApi } from '../client';
import type { AdminLoginRequest, AdminLoginResponse } from '../../types';

export const adminAuthApi = {
  login: (data: AdminLoginRequest) => adminApi.post<AdminLoginResponse>('/admin/auth/login', data),
  logout: () => adminApi.post<void>('/admin/auth/logout', {}),
};
