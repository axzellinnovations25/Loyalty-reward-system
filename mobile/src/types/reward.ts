export type Reward = {
  id: string;
  name: string;
  description?: string | null;
  minPoints: number;
  discountValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateRewardRequest = {
  name: string;
  description?: string | null;
  minPoints: number;
  discountValue: number;
};

export type UpdateRewardRequest = Partial<CreateRewardRequest> & {
  isActive?: boolean;
};

