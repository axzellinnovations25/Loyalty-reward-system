'use strict';

const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Daily job: mark expired gift cards as EXPIRED.
 */
async function run() {
  logger.info('Running giftCardExpiry job');

  const result = await db.giftCard.updateMany({
    where: { expiryDate: { lte: new Date() }, status: 'active' },
    data: { status: 'expired' },
  });

  logger.info('giftCardExpiry job complete', { updated: result.count });
}

module.exports = { run };
