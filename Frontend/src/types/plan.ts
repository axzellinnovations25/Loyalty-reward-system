// Plan IDs are human-readable slugs: 'basic' | 'standard' | 'pro' | 'enterprise'
export type PlanId = 'basic' | 'standard' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  isActive: boolean;
  features: PlanFeature[];
}

export interface PlanFeature {
  id: string;
  planId: string;
  featureKey: string | null;
  limitKey: string | null;
  enabled: boolean;
  limitValue: number | null;
}
