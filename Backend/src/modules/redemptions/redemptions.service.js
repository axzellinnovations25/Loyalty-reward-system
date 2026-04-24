'use strict';

const repository = require('./redemptions.repository');
const db = require('../../config/db');
const sms = require('../../services/sms');
const logger = require('../../utils/logger');

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Given shop settings and points to redeem, calculate the Rs. discount.
 * flat_amount:      discount = pointsRedeemed / redemptionValue   (e.g. 500 pts = Rs 1)
 * percent_of_bill:  discount = (redemptionValue / 100) * billAmount
 */
function calcDiscount(settings, pointsRedeemed, billAmount = 0) {
  const rate = Number(settings.redemptionValue);
  if (settings.maxRedeemMode === 'flat_amount') {
    return pointsRedeemed / rate;
  }
  if (settings.maxRedeemMode === 'percent_of_bill') {
    return (rate / 100) * billAmount;
  }
  return 0;
}

// ── Service functions ──────────────────────────────────────────────────────────

async function list(shopId, query) {
  return repository.findAll(shopId, query);
}

async function getById(shopId, id) {
  const redemption = await repository.findById(id, shopId);
  if (!redemption) throw Object.assign(new Error('Redemption not found'), { status: 404 });
  return redemption;
}

/**
 * Preview: given a customerId + pointsToRedeem, return the discount value.
 * No state is changed.
 */
async function preview(shopId, customerId, pointsToRedeem) {
  const [customer, settings] = await Promise.all([
    db.customer.findFirst({ where: { id: customerId, shopId, deletedAt: null } }),
    db.shopSettings.findUnique({ where: { shopId } }),
  ]);

  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  if (!settings)  throw Object.assign(new Error('Shop settings not configured'), { status: 400 });

  const pts = Number(pointsToRedeem);

  if (pts < 1) throw Object.assign(new Error('Points to redeem must be at least 1'), { status: 422 });
  if (customer.totalPoints < pts) {
    throw Object.assign(
      new Error(`Insufficient points. Available: ${customer.totalPoints}`),
      { status: 422 }
    );
  }
  if (settings.minRedeemPoints && pts < settings.minRedeemPoints) {
    throw Object.assign(
      new Error(`Minimum ${settings.minRedeemPoints} points required to redeem`),
      { status: 422 }
    );
  }

  const discountValue = calcDiscount(settings, pts);

  return {
    pointsToRedeem: pts,
    discountValue: discountValue.toFixed(2),
    remainingPoints: customer.totalPoints - pts,
    minRedeemPoints: settings.minRedeemPoints,
    maxRedeemMode: settings.maxRedeemMode,
    redemptionValue: Number(settings.redemptionValue),
  };
}

async function create(shopId, userId, data) {
  const { customerId, pointsRedeemed, billAmount, notes } = data;

  const [customer, settings] = await Promise.all([
    db.customer.findFirst({ where: { id: customerId, shopId, deletedAt: null } }),
    db.shopSettings.findUnique({ where: { shopId } }),
  ]);

  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  if (!settings)  throw Object.assign(new Error('Shop settings not found'), { status: 400 });

  const pts = Number(pointsRedeemed);

  // Validate points
  if (customer.totalPoints < pts) {
    throw Object.assign(
      new Error(`Insufficient points. Required: ${pts}, Available: ${customer.totalPoints}`),
      { status: 422 }
    );
  }
  if (settings.minRedeemPoints && pts < settings.minRedeemPoints) {
    throw Object.assign(
      new Error(`Minimum points required to redeem is ${settings.minRedeemPoints}`),
      { status: 422 }
    );
  }

  // Calculate discount
  let discountValue = calcDiscount(settings, pts, billAmount);

  // Discount can't exceed the bill
  if (discountValue > billAmount) discountValue = billAmount;

  // Persist atomically
  const [redemption] = await db.$transaction([
    db.redemption.create({
      data: { shopId, customerId, userId, pointsRedeemed: pts, discountValue, notes },
      include: { customer: true },
    }),
    db.customer.update({
      where: { id: customerId },
      data: {
        totalPoints: { decrement: pts },
        lastActivityAt: new Date(),
      },
    }),
  ]);

  // Send SMS (best-effort, never fail the response)
  try {
    const newBalance = customer.totalPoints - pts;
    const message =
      `Hi ${customer.name}, you redeemed ${pts} loyalty points for a Rs. ${discountValue.toFixed(2)} discount. ` +
      `Remaining balance: ${newBalance} pts. Thank you!`;
    await sms.send(shopId, customer.phone, message);

    // Log the message
    await db.messageLog.create({
      data: {
        shopId,
        customerId,
        phone: customer.phone,
        messageType: 'transaction',
        channel: 'sms',
        content: message,
        status: 'sent',
      },
    });
  } catch (smsErr) {
    logger.warn('SMS notification failed for redemption', {
      shopId,
      customerId,
      error: smsErr.message,
    });
    // Try to log failure
    try {
      await db.messageLog.create({
        data: {
          shopId,
          customerId,
          phone: customer.phone,
          messageType: 'transaction',
          channel: 'sms',
          content: '',
          status: 'failed',
        },
      });
    } catch (_) { /* ignore */ }
  }

  return redemption;
}

async function voidRedemption(shopId, id, userId) {
  const redemption = await db.redemption.findUnique({ where: { id, shopId }, include: { customer: true } });
  if (!redemption) throw Object.assign(new Error('Redemption not found'), { status: 404 });
  if (redemption.isVoided) throw Object.assign(new Error('Redemption is already voided'), { status: 400 });

  return db.$transaction(async (tx) => {
    const updated = await tx.redemption.update({
      where: { id },
      data: { isVoided: true },
    });

    await tx.customer.update({
      where: { id: redemption.customerId },
      data: { totalPoints: { increment: redemption.pointsRedeemed } },
    });

    await tx.auditLog.create({
      data: {
        shopId,
        userId,
        action: 'VOID_REDEMPTION',
        entityType: 'REDEMPTION',
        entityId: id,
        details: {
          pointsRestored: redemption.pointsRedeemed,
          discountReversed: Number(redemption.discountValue),
        },
      },
    });

    return updated;
  });
}

module.exports = { list, getById, preview, create, voidRedemption };
