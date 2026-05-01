import { api } from './client';
import type { CreateRewardRequest, Reward, UpdateRewardRequest } from '../types';

export const rewardsApi = {
  list: () => api.get<{ data?: Reward[] } | Reward[]>('/rewards'),
  create: (data: CreateRewardRequest) => api.post<{ data?: Reward } | Reward>('/rewards', data),
  update: (id: string, data: UpdateRewardRequest) => api.patch<{ data?: Reward } | Reward>(`/rewards/${id}`, data),
  delete: (id: string) => api.delete<void>(`/rewards/${id}`),
};

