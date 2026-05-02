import { api } from './client';
import type {
  HeldOrder,
  KitchenTicket,
  PosPayment,
  PosReceipt,
  PosRefund,
  PosTerminal,
  PurchaseOrder,
  RegisterShift,
  StockMovement,
  Supplier,
  TaxRate,
} from '../types/pos';
import type { PaginatedResponse } from '../types';

export const posApi = {
  payments: (params?: Record<string, unknown>) => api.get<PaginatedResponse<PosPayment>>('/pos/payments', params),
  receipts: (params?: Record<string, unknown>) => api.get<PaginatedResponse<PosReceipt>>('/pos/receipts', params),
  reprintReceipt: (id: string, terminalId?: string | null) => api.post<PosReceipt>(`/pos/receipts/${id}/reprint`, { terminalId }),

  refunds: (params?: Record<string, unknown>) => api.get<PaginatedResponse<PosRefund>>('/pos/refunds', params),
  createRefund: (data: unknown) => api.post<PosRefund>('/pos/refunds', data),

  shifts: (params?: Record<string, unknown>) => api.get<PaginatedResponse<RegisterShift>>('/pos/shifts', params),
  currentShift: () => api.get<RegisterShift | null>('/pos/shifts/current'),
  openShift: (data: { openingCash: number; terminalId?: string | null }) => api.post<RegisterShift>('/pos/shifts/open', data),
  cashEvent: (id: string, data: { eventType: string; amount: number; reason?: string; terminalId?: string | null }) => api.post<RegisterShift>(`/pos/shifts/${id}/cash-events`, data),
  closeShift: (id: string, data: { closingCash: number; note?: string; terminalId?: string | null }) => api.post<RegisterShift>(`/pos/shifts/${id}/close`, data),

  stockMovements: (params?: Record<string, unknown>) => api.get<PaginatedResponse<StockMovement>>('/pos/stock-movements', params),
  adjustStock: (data: unknown) => api.post<StockMovement>('/pos/stock-adjustments', data),

  suppliers: () => api.get<Supplier[]>('/pos/suppliers'),
  createSupplier: (data: Partial<Supplier>) => api.post<Supplier>('/pos/suppliers', data),
  updateSupplier: (id: string, data: Partial<Supplier>) => api.put<Supplier>(`/pos/suppliers/${id}`, data),

  purchaseOrders: (params?: Record<string, unknown>) => api.get<PaginatedResponse<PurchaseOrder>>('/pos/purchase-orders', params),
  createPurchaseOrder: (data: unknown) => api.post<PurchaseOrder>('/pos/purchase-orders', data),
  receivePurchaseOrder: (id: string, data: unknown) => api.post<PurchaseOrder>(`/pos/purchase-orders/${id}/receive`, data),

  taxRates: () => api.get<TaxRate[]>('/pos/tax-rates'),
  createTaxRate: (data: Partial<TaxRate>) => api.post<TaxRate>('/pos/tax-rates', data),
  updateTaxRate: (id: string, data: Partial<TaxRate>) => api.put<TaxRate>(`/pos/tax-rates/${id}`, data),

  heldOrders: (params?: Record<string, unknown>) => api.get<HeldOrder[]>('/pos/held-orders', params),
  createHeldOrder: (data: unknown) => api.post<HeldOrder>('/pos/held-orders', data),
  updateHeldOrder: (id: string, data: Partial<HeldOrder>) => api.put<HeldOrder>(`/pos/held-orders/${id}`, data),

  variants: (productId: string) => api.get('/pos/products/' + productId + '/variants'),
  createVariant: (productId: string, data: unknown) => api.post('/pos/products/' + productId + '/variants', data),
  modifierGroups: (productId: string) => api.get('/pos/products/' + productId + '/modifier-groups'),
  createModifierGroup: (productId: string, data: unknown) => api.post('/pos/products/' + productId + '/modifier-groups', data),

  permissions: () => api.get('/pos/permissions'),
  setPermissions: (permissions: unknown[]) => api.put('/pos/permissions', { permissions }),

  kitchenTickets: (params?: Record<string, unknown>) => api.get<KitchenTicket[]>('/pos/kitchen-tickets', params),
  createKitchenTicket: (data: unknown) => api.post<KitchenTicket>('/pos/kitchen-tickets', data),
  updateKitchenTicket: (id: string, data: Partial<KitchenTicket>) => api.put<KitchenTicket>(`/pos/kitchen-tickets/${id}`, data),

  terminals: () => api.get<PosTerminal[]>('/pos/terminals'),
  createTerminal: (data: Partial<PosTerminal>) => api.post<PosTerminal>('/pos/terminals', data),

  professionalReport: (params?: Record<string, unknown>) => api.get('/pos/reports/professional', params),
};
