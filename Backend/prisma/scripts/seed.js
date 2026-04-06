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
      { limitKey: 'max_customers',     limitValue: 500 },
      { limitKey: 'max_users',         limitValue: 1 },
      { limitKey: 'max_gift_cards_pm', limitValue: 0 },
      { limitKey: 'max_sms_pm',        limitValue: 0 },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    features: ['gift_cards', 'rewards_milestones', 'audit_log'],
    limits: [
      { limitKey: 'max_customers',     limitValue: 2000 },
      { limitKey: 'max_users',         limitValue: 2 },
      { limitKey: 'max_gift_cards_pm', limitValue: 50 },
      { limitKey: 'max_sms_pm',        limitValue: 0 },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    features: ['gift_cards', 'rewards_milestones', 'audit_log', 'sms_messaging', 'promotions_broadcasts', 'reports_exports'],
    limits: [
      { limitKey: 'max_customers',     limitValue: 10000 },
      { limitKey: 'max_users',         limitValue: 5 },
      { limitKey: 'max_gift_cards_pm', limitValue: 200 },
      { limitKey: 'max_sms_pm',        limitValue: 1000 },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    features: [
      'gift_cards', 'rewards_milestones', 'audit_log', 'sms_messaging', 
      'promotions_broadcasts', 'reports_exports', 'whatsapp_messaging', 'multiple_users'
    ],
    limits: [
      { limitKey: 'max_customers',     limitValue: -1 },
      { limitKey: 'max_users',         limitValue: -1 },
      { limitKey: 'max_gift_cards_pm', limitValue: -1 },
      { limitKey: 'max_sms_pm',        limitValue: -1 },
    ],
  },
];

async function main() {
  console.log('Seeding plans...');

  for (const plan of plans) {
    const { features, limits, ...planData } = plan;

    // Delete existing features/limits for this plan to avoid dupes or stale data
    await db.planFeature.deleteMany({ where: { planId: planData.id } });

    await db.plan.upsert({
      where: { id: planData.id },
      update: {
        name: planData.name,
        isActive: true,
      },
      create: {
        id: planData.id,
        name: planData.name,
        isActive: true,
      },
    });

    // Create new features/limits
    await db.planFeature.createMany({
      data: [
        ...features.map(f => ({ planId: plan.id, featureKey: f, enabled: true })),
        ...limits.map(l => ({ planId: plan.id, limitKey: l.limitKey, limitValue: l.limitValue, enabled: true }))
      ]
    });

    console.log(`  ✓ ${planData.name}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
