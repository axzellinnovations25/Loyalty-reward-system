'use strict';

const db = require('../config/db');
const { getLimit } = require('../services/entitlements');
const { LIMITS } = require('../config/constants');
const logger = require('../utils/logger');

const WARNING_THRESHOLD = 0.9; // warn at 90 % of limit

/**
 * Daily job: flag shops that are at or above WARNING_THRESHOLD of their customer limit.
 */
async function run() {
  logger.info('Running usageWarning job');

  const shops = await db.shop.findMany({ select: { id: true } });

  for (const { id: shopId } of shops) {
    const maxCustomers = await getLimit(shopId, LIMITS.CUSTOMERS);
    if (maxCustomers === -1) continue; // unlimited

    const count = await db.customer.count({ where: { shopId } });
    if (count >= maxCustomers * WARNING_THRESHOLD) {
      await db.shop.update({
        where: { id: shopId },
        data: { usageWarningAt: new Date() },
      }).catch(() => {});
      logger.info('Usage warning flagged', { shopId, count, maxCustomers });
    }
  }

  logger.info('usageWarning job complete');
}

module.exports = { run };
