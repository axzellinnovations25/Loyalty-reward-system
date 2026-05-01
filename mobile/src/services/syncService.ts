import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { upsertCustomers, upsertRewards, upsertPurchases, upsertRedemptions } from '../lib/db';

const LAST_SYNC_KEY = '@last_sync_at';
const SYNC_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export const syncService = {
  async checkAndSync(force = false) {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const now = Date.now();

      if (force || !lastSync || now - parseInt(lastSync) > SYNC_INTERVAL) {
        console.log('Starting full data sync...');
        await this.performSync();
        await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());
        console.log('Sync completed successfully.');
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  },

  async performSync() {
    try {
      // 1. Fetch data from backend
      const [customersRes, rewardsRes, purchasesRes, redemptionsRes] = await Promise.all([
        api.get<any>('/customers?limit=1000'),
        api.get<any>('/rewards'),
        api.get<any>('/purchases?limit=1000'),
        api.get<any>('/redemptions?limit=1000'),
      ]);
      
      const customers = (customersRes as any).data ?? customersRes;
      const rewards = (rewardsRes as any).data ?? rewardsRes;
      const purchases = (purchasesRes as any).data ?? (purchasesRes as any).items ?? purchasesRes;
      const redemptions = (redemptionsRes as any).data ?? (redemptionsRes as any).items ?? redemptionsRes;

      // 2. Push to local DB
      if (Array.isArray(customers)) await upsertCustomers(customers);
      if (Array.isArray(rewards)) await upsertRewards(rewards);
      if (Array.isArray(purchases)) await upsertPurchases(purchases);
      if (Array.isArray(redemptions)) await upsertRedemptions(redemptions);
      
    } catch (e) {
      console.error('Error in performSync:', e);
      throw e;
    }
  },

  async getLastSyncDate() {
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return lastSync ? new Date(parseInt(lastSync)) : null;
  }
};
