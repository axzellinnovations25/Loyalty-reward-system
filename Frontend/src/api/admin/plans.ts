import { adminApi } from '../client';
import type { Plan } from '../../types';

export const adminPlansApi = {
  list: () => adminApi.get<Plan[]>('/admin/plans'),
  get: (id: string) => adminApi.get<Plan>(`/admin/plans/${id}`),
};
