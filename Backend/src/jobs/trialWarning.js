'use strict';

const db = require('../config/db');
const sms = require('../services/sms');
const logger = require('../utils/logger');

const WARNING_DAYS = 3;

/**
 * Daily job: notify shop owners that their trial ends within WARNING_DAYS.
 */
async function run() {
  logger.info('Running trialWarning job');
  const cutoff = new Date(Date.now() + WARNING_DAYS * 24 * 60 * 60 * 1000);

  const soon = await db.subscription.findMany({
    where: {
      isTrial: true,
      trialEndsAt: { gt: new Date(), lte: cutoff },
      trialWarningSent: false,
    },
    include: { shop: { include: { owner: true } } },
  });

  for (const sub of soon) {
    const ownerPhone = sub.shop?.owner?.phone;
    if (ownerPhone) {
      await sms.send(
        sub.shopId,
        ownerPhone,
        `Your free trial ends on ${sub.trialEndsAt.toDateString()}. Upgrade your plan to keep all features.`
      ).catch(err => logger.warn('Failed to send trial warning SMS', { shopId: sub.shopId, err: err.message }));
    }

    await db.subscription.update({ where: { id: sub.id }, data: { trialWarningSent: true } });
  }

  logger.info('trialWarning job complete', { processed: soon.length });
}

module.exports = { run };
