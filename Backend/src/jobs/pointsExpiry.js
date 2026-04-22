'use strict';

const db = require('../config/db');
const sms = require('../services/sms');
const logger = require('../utils/logger');

/**
 * Daily job: zero out expired customer points and send SMS notification.
 */
async function run() {
  logger.info('Running pointsExpiry job');
  
  const shops = await db.shop.findMany({
    where: { isActive: true },
    include: { settings: true }
  });

  let processedCount = 0;

  for (const shop of shops) {
    if (!shop.settings || shop.settings.pointsExpiryMonths === 0) continue;

    const expiryMonths = shop.settings.pointsExpiryMonths;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - expiryMonths);

    // Find customers whose last activity is before cutoffDate and have points > 0
    const expiredCustomers = await db.customer.findMany({
      where: {
        shopId: shop.id,
        totalPoints: { gt: 0 },
        lastActivityAt: { lte: cutoffDate },
        deletedAt: null
      }
    });

    for (const customer of expiredCustomers) {
      await db.customer.update({
        where: { id: customer.id },
        data: { totalPoints: 0 }
      });

      // Log to audit trail
      await db.auditLog.create({
        data: {
          shopId: shop.id,
          action: 'POINTS_EXPIRED',
          entityType: 'Customer',
          entityId: customer.id,
          details: { previousPoints: customer.totalPoints }
        }
      });

      // Send SMS if enabled
      if (shop.settings.smsEnabled && customer.phone) {
        await sms.send(
          shop.id,
          customer.phone,
          `Your ${customer.totalPoints} loyalty points have expired due to inactivity. Visit us to earn new points!`
        ).catch(err => logger.warn('Failed to send expiry SMS', { customerId: customer.id, err: err.message }));
      }
      
      processedCount++;
    }
  }

  logger.info('pointsExpiry job complete', { processed: processedCount });
}

module.exports = { run };
