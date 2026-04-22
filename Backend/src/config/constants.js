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
  GIFT_CARDS:            'gift_cards',
  REWARDS_MILESTONES:    'rewards_milestones',
  AUDIT_LOG:             'audit_log',
  SMS_MESSAGING:         'sms_messaging',
  PROMOTIONS_BROADCASTS: 'promotions_broadcasts',
  REPORTS_EXPORTS:       'reports_exports',
  WHATSAPP_MESSAGING:    'whatsapp_messaging',
  MULTIPLE_USERS:        'multiple_users',
};

// Usage limit keys (must match plan_limits.limit_key in DB)
const LIMITS = {
  CUSTOMERS:      'max_customers',
  SMS_PER_MONTH:  'max_sms_pm',
  GIFT_CARDS:     'max_gift_cards_pm',
  STAFF_ACCOUNTS: 'max_users',
};

// Token expiry for trials (days)
const TRIAL_DURATION_DAYS = 14;

// Points expiry default (days, 0 = never)
const DEFAULT_POINTS_EXPIRY_DAYS = 365;

module.exports = { PLANS, FEATURES, LIMITS, TRIAL_DURATION_DAYS, DEFAULT_POINTS_EXPIRY_DAYS };
