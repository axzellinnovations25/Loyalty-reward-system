'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    features: [],
    limits: [
      { limitKey: 'customers',     limitValue: 100 },
      { limitKey: 'sms_per_month', limitValue: 0 },
      { limitKey: 'gift_cards',    limitValue: 0 },
      { limitKey: 'staff_accounts',limitValue: 1 },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    features: ['sms_campaigns', 'points_expiry'],
    limits: [
      { limitKey: 'customers',     limitValue: 500 },
      { limitKey: 'sms_per_month', limitValue: 500 },
      { limitKey: 'gift_cards',    limitValue: 50 },
      { limitKey: 'staff_accounts',limitValue: 3 },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    features: ['sms_campaigns', 'points_expiry', 'gift_cards', 'advanced_reports', 'custom_rewards'],
    limits: [
      { limitKey: 'customers',     limitValue: 2000 },
      { limitKey: 'sms_per_month', limitValue: 2000 },
      { limitKey: 'gift_cards',    limitValue: 500 },
      { limitKey: 'staff_accounts',limitValue: 10 },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    features: ['sms_campaigns', 'points_expiry', 'gift_cards', 'advanced_reports', 'custom_rewards', 'multi_tier', 'api_access', 'white_label'],
    limits: [
      { limitKey: 'customers',     limitValue: -1 },
      { limitKey: 'sms_per_month', limitValue: -1 },
      { limitKey: 'gift_cards',    limitValue: -1 },
      { limitKey: 'staff_accounts',limitValue: -1 },
    ],
  },
];

async function main() {
  console.log('Seeding plans...');

  for (const plan of plans) {
    const { features, limits, ...planData } = plan;

    await db.plan.upsert({
      where: { id: planData.id },
      update: {
        name: planData.name,
        isActive: true,
      },
      create: {
        ...planData,
        features: { 
          create: [
            ...features.map(featureKey => ({ featureKey, enabled: true })),
            ...limits.map(limit => ({ limitKey: limit.limitKey, limitValue: limit.limitValue, enabled: true }))
          ] 
        },
      },
    });

    console.log(`  ✓ ${planData.name}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
