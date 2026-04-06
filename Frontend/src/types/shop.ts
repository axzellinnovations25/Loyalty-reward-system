export interface Shop {
  id: string;
  name: string;
  email: string;
  contactInfo: string | null;
  planId: string;
  planAssignedAt: string;
  trialPlanId: string | null;
  trialExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateShopRequest {
  name: string;
  email: string;
  contactInfo?: string;
  planId: string;
}

export interface UpdateShopRequest {
  name?: string;
  email?: string;
  contactInfo?: string;
  isActive?: boolean;
}

export interface AssignPlanRequest {
  planId: string;
  note?: string;
}

export interface AssignTrialRequest {
  trialPlanId: string;
  trialDays: number;
}
