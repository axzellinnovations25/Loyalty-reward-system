import { api } from './client';
import type { DashboardSummary } from '../types';

export const reportsApi = {
  getSummary: (from?: string, to?: string) => api.get<{ data?: DashboardSummary } | DashboardSummary>('/reports/summary', { from, to }),
};
