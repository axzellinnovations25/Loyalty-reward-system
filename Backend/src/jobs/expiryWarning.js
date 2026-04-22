'use strict';

const db = require('../config/db');
const sms = require('../services/sms');
const logger = require('../utils/logger');

/**
 * Daily job: SMS warning to customers whose points expire within expiryWarningDays.
 */
async function run() {
  logger.info('Running expiryWarning job');
  
  const shops = await db.shop.findMany({
    where: { isActive: true },
    include: { settings: true }
  });

  let processedCount = 0;

  for (const shop of shops) {
    if (!shop.settings || shop.settings.pointsExpiryMonths === 0 || !shop.settings.smsEnabled) continue;

    const expiryMonths = shop.settings.pointsExpiryMonths;
    const warningDays = shop.settings.expiryWarningDays || 14;

    const warningCutoffDate = new Date();
    // A customer should be warned if their expiry date is within warningDays from now.
    // Expiry Date = lastActivityAt + expiryMonths
    // So if (lastActivityAt + expiryMonths) <= (NOW + warningDays), we should warn them.
    // Equivalent to: lastActivityAt <= NOW + warningDays - expiryMonths
    warningCutoffDate.setDate(warningCutoffDate.getDate() + warningDays);
    warningCutoffDate.setMonth(warningCutoffDate.getMonth() - expiryMonths);

    const actualExpiryCutoffDate = new Date();
    actualExpiryCutoffDate.setMonth(actualExpiryCutoffDate.getMonth() - expiryMonths);

    // Find customers who are in the warning period but haven't actually expired yet.
    // lastActivityAt is between actualExpiryCutoffDate (exclusive) and warningCutoffDate (inclusive)
    const soonToExpire = await db.customer.findMany({
      where: {
        shopId: shop.id,
        totalPoints: { gt: 0 },
        lastActivityAt: { 
          gt: actualExpiryCutoffDate,
          lte: warningCutoffDate 
        },
        deletedAt: null
      }
    });

    for (const customer of soonToExpire) {
      if (!customer.phone) continue;

      // Check if we already sent a warning in the last `warningDays`
      const recentWarningDate = new Date();
      recentWarningDate.setDate(recentWarningDate.getDate() - warningDays);

      const existingWarning = await db.messageLog.findFirst({
        where: {
          shopId: shop.id,
          customerId: customer.id,
          messageType: 'expiry_warning',
          createdAt: { gte: recentWarningDate }
        }
      });

      if (existingWarning) continue;

      // Calculate actual expiry date
      const expiryDate = new Date(customer.lastActivityAt || customer.createdAt);
      expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

      try {
        await sms.send(
          shop.id,
          customer.phone,
          `Reminder: Your ${customer.totalPoints} loyalty points expire on ${expiryDate.toDateString()}. Redeem them soon!`
        );

        await db.messageLog.create({
          data: {
            shopId: shop.id,
            customerId: customer.id,
            phone: customer.phone,
            messageType: 'expiry_warning',
            content: `Reminder: Your ${customer.totalPoints} loyalty points expire on ${expiryDate.toDateString()}. Redeem them soon!`
          }
        });
        processedCount++;
      } catch (err) {
        logger.warn('Failed to send expiry warning SMS', { customerId: customer.id, err: err.message });
      }
    }
  }

  logger.info('expiryWarning job complete', { processed: processedCount });
}

module.exports = { run };
