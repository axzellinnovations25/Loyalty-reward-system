import { api } from './client';
import type { Reward, CreateRewardRequest, UpdateRewardRequest } from '../types';

export const rewardsApi = {
  list: () => api.get<Reward[]>('/rewards'),
  create: (data: CreateRewardRequest) => api.post<Reward>('/rewards', data),
  update: (id: string, data: UpdateRewardRequest) =>
    api.patch<Reward>(`/rewards/${id}`, data),
  delete: (id: string) => api.delete<void>(`/rewards/${id}`),
};
