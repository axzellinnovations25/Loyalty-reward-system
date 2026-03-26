import { api } from './client';
import type { ShopSettings, UpdateShopSettingsRequest } from '../types';

export const settingsApi = {
  get: () => api.get<ShopSettings>('/settings'),
  update: (data: UpdateShopSettingsRequest) => api.patch<ShopSettings>('/settings', data),
};
