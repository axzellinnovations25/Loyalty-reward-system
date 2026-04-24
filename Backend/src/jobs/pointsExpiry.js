'use strict';

const db = require('../config/db');
const sms = require('../services/sms');
const logger = require('../utils/logger');

/**
 * Daily job: zero out expired customer points and notify the customer via SMS.
 */
async function run() {
  logger.info('Running pointsExpiry job');

  const shops = await db.shop.findMany({
    where: { isActive: true },
    include: { settings: true },
  });

  let processedCount = 0;

  for (const shop of shops) {
    if (!shop.settings || shop.settings.pointsExpiryMonths === 0) continue;

    const expiryMonths = shop.settings.pointsExpiryMonths;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - expiryMonths);

    // Find customers whose last activity is before cutoffDate and still have points
    const expiredCustomers = await db.customer.findMany({
      where: {
        shopId: shop.id,
        totalPoints: { gt: 0 },
        lastActivityAt: { lte: cutoffDate },
        deletedAt: null,
      },
    });

    for (const customer of expiredCustomers) {
      const previousPoints = customer.totalPoints;

      // Zero out their points
      await db.customer.update({
        where: { id: customer.id },
        data: { totalPoints: 0 },
      });

      // Audit trail
      await db.auditLog.create({
        data: {
          shopId: shop.id,
          action: 'POINTS_EXPIRED',
          entityType: 'Customer',
          entityId: customer.id,
          details: { previousPoints },
        },
      });

      // Notify customer via SMS (best-effort)
      if (customer.phone) {
        const message =
          `Hi ${customer.name}, your ${previousPoints} loyalty points have expired due to inactivity. ` +
          `Start earning points again on your next visit. We hope to see you soon!`;

        let smsStatus = 'sent';
        try {
          await sms.send(shop.id, customer.phone, message);
        } catch (smsErr) {
          smsStatus = 'failed';
          logger.warn('Points expiry SMS failed', {
            shopId: shop.id,
            customerId: customer.id,
            error: smsErr.message,
          });
        }

        // Log the message attempt
        try {
          await db.messageLog.create({
            data: {
              shopId: shop.id,
              customerId: customer.id,
              phone: customer.phone,
              messageType: 'expiry_warning',
              channel: 'sms',
              content: message,
              status: smsStatus,
            },
          });
        } catch (logErr) {
          logger.warn('Failed to write points expiry messageLog', { error: logErr.message });
        }
      }

      processedCount++;
    }
  }

  logger.info('pointsExpiry job complete', { processed: processedCount });
}

module.exports = { run };
