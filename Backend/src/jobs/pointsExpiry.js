'use strict';

const db = require('../config/db');
const sms = require('../services/sms');
const logger = require('../utils/logger');

/**
 * Daily job: zero out expired customer points and send SMS notification.
 */
async function run() {
  logger.info('Running pointsExpiry job');
  const now = new Date();

  const expired = await db.customerPoints.findMany({
    where: { expiresAt: { lte: now }, points: { gt: 0 } },
    include: { customer: true },
  });

  for (const record of expired) {
    await db.customerPoints.update({
      where: { id: record.id },
      data: { points: 0 },
    });

    if (record.customer.phone) {
      await sms.send(
        record.customer.shopId,
        record.customer.phone,
        `Your ${record.points} loyalty points have expired. Visit us to earn new points!`
      ).catch(err => logger.warn('Failed to send expiry SMS', { customerId: record.customerId, err: err.message }));
    }
  }

  logger.info('pointsExpiry job complete', { processed: expired.length });
}

module.exports = { run };
