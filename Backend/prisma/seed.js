'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const plans = [
  {
    slug: 'free',
    name: 'Free',
    priceMonthly: 0,
    sortOrder: 1,
    features: [],
    limits: [
      { limitKey: 'customers',     value: 100 },
      { limitKey: 'sms_per_month', value: 0 },
      { limitKey: 'gift_cards',    value: 0 },
      { limitKey: 'staff_accounts',value: 1 },
    ],
  },
  {
    slug: 'starter',
    name: 'Starter',
    priceMonthly: 2500,
    sortOrder: 2,
    features: ['sms_campaigns', 'points_expiry'],
    limits: [
      { limitKey: 'customers',     value: 500 },
      { limitKey: 'sms_per_month', value: 500 },
      { limitKey: 'gift_cards',    value: 50 },
      { limitKey: 'staff_accounts',value: 3 },
    ],
  },
  {
    slug: 'growth',
    name: 'Growth',
    priceMonthly: 5000,
    sortOrder: 3,
    features: ['sms_campaigns', 'points_expiry', 'gift_cards', 'advanced_reports', 'custom_rewards'],
    limits: [
      { limitKey: 'customers',     value: 2000 },
      { limitKey: 'sms_per_month', value: 2000 },
      { limitKey: 'gift_cards',    value: 500 },
      { limitKey: 'staff_accounts',value: 10 },
    ],
  },
  {
    slug: 'pro',
    name: 'Pro',
    priceMonthly: 10000,
    sortOrder: 4,
    features: ['sms_campaigns', 'points_expiry', 'gift_cards', 'advanced_reports', 'custom_rewards', 'multi_tier', 'api_access', 'white_label'],
    limits: [
      { limitKey: 'customers',     value: -1 },
      { limitKey: 'sms_per_month', value: -1 },
      { limitKey: 'gift_cards',    value: -1 },
      { limitKey: 'staff_accounts',value: -1 },
    ],
  },
];

async function main() {
  console.log('Seeding plans...');

  for (const plan of plans) {
    const { features, limits, ...planData } = plan;

    await db.plan.upsert({
      where: { slug: planData.slug },
      update: { ...planData },
      create: {
        ...planData,
        features: { create: features.map(featureKey => ({ featureKey })) },
        limits:   { create: limits },
      },
    });

    console.log(`  ✓ ${planData.name}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
