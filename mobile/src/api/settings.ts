import { api } from './client';
import type { ShopSettings, UpdateShopSettingsRequest } from '../types';

export const settingsApi = {
  get: () => api.get<{ data?: ShopSettings } | ShopSettings>('/settings'),
  update: (data: UpdateShopSettingsRequest) => api.patch<{ data?: ShopSettings } | ShopSettings>('/settings', data),
};

