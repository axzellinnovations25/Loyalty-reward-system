'use strict';

const db = require('../config/db');
const sms = require('../services/sms');
const logger = require('../utils/logger');

const WARNING_DAYS = 7;

/**
 * Daily job: SMS warning to customers whose points expire within WARNING_DAYS.
 */
async function run() {
  logger.info('Running expiryWarning job');
  const cutoff = new Date(Date.now() + WARNING_DAYS * 24 * 60 * 60 * 1000);

  const soon = await db.customerPoints.findMany({
    where: {
      expiresAt: { gt: new Date(), lte: cutoff },
      points: { gt: 0 },
      warningSent: false,
    },
    include: { customer: true },
  });

  for (const record of soon) {
    if (record.customer.phone) {
      await sms.send(
        record.customer.shopId,
        record.customer.phone,
        `Reminder: Your ${record.points} loyalty points expire on ${record.expiresAt.toDateString()}. Redeem them soon!`
      ).catch(err => logger.warn('Failed to send expiry warning SMS', { customerId: record.customerId, err: err.message }));
    }

    await db.customerPoints.update({ where: { id: record.id }, data: { warningSent: true } });
  }

  logger.info('expiryWarning job complete', { processed: soon.length });
}

module.exports = { run };
