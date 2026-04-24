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
    include: { settings: true },
  });

  let processedCount = 0;

  for (const shop of shops) {
    if (!shop.settings || shop.settings.pointsExpiryMonths === 0) continue;

    const expiryMonths = shop.settings.pointsExpiryMonths;
    const warningDays = shop.settings.expiryWarningDays || 14;

    // A customer should be warned if their expiry date is within warningDays from now.
    // Expiry Date = lastActivityAt + expiryMonths
    // So if (lastActivityAt + expiryMonths) <= (NOW + warningDays), we should warn them.
    // Equivalent to: lastActivityAt <= NOW + warningDays - expiryMonths
    const warningCutoffDate = new Date();
    warningCutoffDate.setDate(warningCutoffDate.getDate() + warningDays);
    warningCutoffDate.setMonth(warningCutoffDate.getMonth() - expiryMonths);

    // Customers who have already expired (we won't double-warn them)
    const actualExpiryCutoffDate = new Date();
    actualExpiryCutoffDate.setMonth(actualExpiryCutoffDate.getMonth() - expiryMonths);

    // Find customers who are in the warning window but haven't actually expired yet.
    // lastActivityAt is between actualExpiryCutoffDate (exclusive) and warningCutoffDate (inclusive)
    const soonToExpire = await db.customer.findMany({
      where: {
        shopId: shop.id,
        totalPoints: { gt: 0 },
        lastActivityAt: {
          gt: actualExpiryCutoffDate,
          lte: warningCutoffDate,
        },
        deletedAt: null,
      },
    });

    for (const customer of soonToExpire) {
      if (!customer.phone) continue;

      // Check if we already sent a warning in the last `warningDays` to avoid spam
      const recentWarningDate = new Date();
      recentWarningDate.setDate(recentWarningDate.getDate() - warningDays);

      const existingWarning = await db.messageLog.findFirst({
        where: {
          shopId: shop.id,
          customerId: customer.id,
          messageType: 'expiry_warning',
          createdAt: { gte: recentWarningDate },
        },
      });

      if (existingWarning) continue;

      // Calculate actual expiry date to include in the message
      const expiryDate = new Date(customer.lastActivityAt || customer.createdAt);
      expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
      const expiryDateStr = expiryDate.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });

      const message =
        `Hi ${customer.name}, your ${customer.totalPoints} loyalty points will expire on ${expiryDateStr}. ` +
        `Visit us before then to keep your points! Thank you for your loyalty.`;

      // Send SMS (best-effort — never block the job on SMS failure)
      let smsStatus = 'sent';
      try {
        await sms.send(shop.id, customer.phone, message);
      } catch (smsErr) {
        smsStatus = 'failed';
        logger.warn('Expiry warning SMS failed', {
          shopId: shop.id,
          customerId: customer.id,
          error: smsErr.message,
        });
      }

      // Always log the attempt
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
        logger.warn('Failed to write expiry warning messageLog', { error: logErr.message });
      }

      processedCount++;
    }
  }

  logger.info('expiryWarning job complete', { processed: processedCount });
}

module.exports = { run };
