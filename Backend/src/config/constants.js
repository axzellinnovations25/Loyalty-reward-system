'use strict';

// Plan IDs (must match plan slugs in DB)
const PLANS = {
  FREE: 'free',
  STARTER: 'starter',
  GROWTH: 'growth',
  PRO: 'pro',
};

// Feature flag keys (must match plan_features.feature_key in DB)
const FEATURES = {
  SMS_CAMPAIGNS: 'sms_campaigns',
  GIFT_CARDS: 'gift_cards',
  ADVANCED_REPORTS: 'advanced_reports',
  POINTS_EXPIRY: 'points_expiry',
  CUSTOM_REWARDS: 'custom_rewards',
  MULTI_TIER: 'multi_tier',
  API_ACCESS: 'api_access',
  WHITE_LABEL: 'white_label',
};

// Usage limit keys (must match plan_limits.limit_key in DB)
const LIMITS = {
  CUSTOMERS: 'customers',
  SMS_PER_MONTH: 'sms_per_month',
  GIFT_CARDS: 'gift_cards',
  STAFF_ACCOUNTS: 'staff_accounts',
};

// Token expiry for trials (days)
const TRIAL_DURATION_DAYS = 14;

// Points expiry default (days, 0 = never)
const DEFAULT_POINTS_EXPIRY_DAYS = 365;

module.exports = { PLANS, FEATURES, LIMITS, TRIAL_DURATION_DAYS, DEFAULT_POINTS_EXPIRY_DAYS };
