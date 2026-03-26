export interface Reward {
  id: string;
  shopId: string;
  pointsRequired: number;
  rewardDescription: string;
  isActive: boolean;
}

export interface CreateRewardRequest {
  pointsRequired: number;
  rewardDescription: string;
}

export interface UpdateRewardRequest {
  pointsRequired?: number;
  rewardDescription?: string;
  isActive?: boolean;
}
