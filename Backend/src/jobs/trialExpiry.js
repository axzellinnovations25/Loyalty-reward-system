'use strict';

const db = require('../config/db');
const { invalidate } = require('../services/entitlements');
const { PLANS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Daily job: revert shops whose trial period has ended back to the free plan.
 */
async function run() {
  logger.info('Running trialExpiry job');
  const now = new Date();

  const expiredTrials = await db.subscription.findMany({
    where: { isTrial: true, trialEndsAt: { lte: now } },
    include: { shop: true },
  });

  const freePlan = await db.plan.findUnique({ where: { slug: PLANS.FREE } });
  if (!freePlan) {
    logger.error('Free plan not found in DB — cannot revert trials');
    return;
  }

  for (const sub of expiredTrials) {
    await db.subscription.update({
      where: { id: sub.id },
      data: { planId: freePlan.id, isTrial: false, trialEndsAt: null },
    });
    invalidate(sub.shopId);
    logger.info('Trial reverted to free plan', { shopId: sub.shopId });
  }

  logger.info('trialExpiry job complete', { processed: expiredTrials.length });
}

module.exports = { run };
