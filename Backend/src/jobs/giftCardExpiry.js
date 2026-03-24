'use strict';

const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Daily job: mark expired gift cards as EXPIRED.
 */
async function run() {
  logger.info('Running giftCardExpiry job');

  const result = await db.giftCard.updateMany({
    where: { expiresAt: { lte: new Date() }, status: 'ACTIVE' },
    data: { status: 'EXPIRED' },
  });

  logger.info('giftCardExpiry job complete', { updated: result.count });
}

module.exports = { run };
