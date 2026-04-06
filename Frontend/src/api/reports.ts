import { api } from './client';
import type { DashboardSummary, DayStats, TopCustomerStats } from '../types';

export const reportsApi = {
  getSummary: (from?: string, to?: string) => 
    api.get<DashboardSummary>('/reports/summary', { params: { from, to } }),
    
  getTopCustomers: (limit: number = 10) => 
    api.get<TopCustomerStats[]>('/reports/top-customers', { params: { limit } }),
    
  getPurchasesByDay: (from?: string, to?: string) => 
    api.get<DayStats[]>('/reports/purchases-by-day', { params: { from, to } }),
};
