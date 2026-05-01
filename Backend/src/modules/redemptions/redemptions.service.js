'use strict';

const repository = require('./redemptions.repository');
const db = require('../../config/db');
const sms = require('../../services/sms');
const logger = require('../../utils/logger');

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Calculate the Rs. discount value given shop settings, points, and bill amount.
 *
 * flat_amount:     discount = pointsRedeemed / redemptionValue
 *                 (e.g. 500 pts at rate 500 = Rs 1 discount per point-set)
 *
 * percent_of_bill: THRESHOLD GATE — customer unlocks a fixed % off the bill
 *                 by spending exactly `minRedeemPoints` points.
 *                 redemptionValue = the discount percentage (e.g. 10 = 10% off)
 *                 pointsRedeemed is always exactly minRedeemPoints in this mode.
 */
function calcDiscount(settings, pointsRedeemed, billAmount = 0) {
  const rate = Number(settings.redemptionValue);
  if (settings.maxRedeemMode === 'flat_amount') {
    return pointsRedeemed / rate;
  }
  if (settings.maxRedeemMode === 'percent_of_bill') {
    // Fixed % of bill — points are the admission ticket, not a multiplier
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
async function preview(shopId, customerId, pointsToRedeem, billAmount = 0) {
  const [customer, settings] = await Promise.all([
    db.customer.findFirst({ where: { id: customerId, shopId, deletedAt: null } }),
    db.shopSettings.findUnique({ where: { shopId } }),
  ]);

  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  if (!settings)  throw Object.assign(new Error('Shop settings not configured'), { status: 400 });

  // In percent_of_bill mode, always use minRedeemPoints as the cost
  const pts = settings.maxRedeemMode === 'percent_of_bill'
    ? settings.minRedeemPoints
    : Number(pointsToRedeem);

  if (pts < 1) throw Object.assign(new Error('Points to redeem must be at least 1'), { status: 422 });

  if (customer.totalPoints < pts) {
    throw Object.assign(
      new Error(`Insufficient points. Available: ${customer.totalPoints}, Required: ${pts}`),
      { status: 422 }
    );
  }

  if (settings.minRedeemPoints && pts < settings.minRedeemPoints) {
    throw Object.assign(
      new Error(`Minimum ${settings.minRedeemPoints} points required to redeem`),
      { status: 422 }
    );
  }

  const discountValue = calcDiscount(settings, pts, Number(billAmount));

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
  const { customerId, billAmount, notes } = data;

  const [customer, settings] = await Promise.all([
    db.customer.findFirst({ where: { id: customerId, shopId, deletedAt: null } }),
    db.shopSettings.findUnique({ where: { shopId } }),
  ]);

  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  if (!settings)  throw Object.assign(new Error('Shop settings not found'), { status: 400 });

  // Determine points to deduct based on redemption mode
  // percent_of_bill: always costs exactly minRedeemPoints (threshold gate)
  // flat_amount: uses the requested pointsRedeemed
  let pts;
  if (settings.maxRedeemMode === 'percent_of_bill') {
    pts = settings.minRedeemPoints;
    if (!pts || pts < 1) {
      throw Object.assign(
        new Error('Minimum redeem points not configured for percent_of_bill mode'),
        { status: 400 }
      );
    }
  } else {
    pts = Number(data.pointsRedeemed);
  }

  // Validate points balance
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
  let discountValue = calcDiscount(settings, pts, Number(billAmount));

  // Discount cannot exceed the bill amount
  if (billAmount && discountValue > Number(billAmount)) discountValue = Number(billAmount);

  // Persist atomically
  const [redemption] = await db.$transaction([
    db.redemption.create({
      data: { shopId, customerId, userId, pointsRedeemed: pts, discountValue, notes: notes ?? null },
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

  // Send SMS (best-effort)
  try {
    const newBalance = customer.totalPoints - pts;
    const message =
      `Hi ${customer.name}, you redeemed ${pts} loyalty points for a Rs. ${Number(discountValue).toFixed(2)} discount. ` +
      `Remaining balance: ${newBalance} pts. Thank you!`;
    await sms.send(shopId, customer.phone, message);

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
  const redemption = await db.redemption.findUnique({
    where: { id, shopId },
    include: { customer: true },
  });
  if (!redemption) throw Object.assign(new Error('Redemption not found'), { status: 404 });
  if (redemption.isVoided) throw Object.assign(new Error('Redemption is already voided'), { status: 400 });

  return db.$transaction(async (tx) => {
    const updated = await tx.redemption.update({
      where: { id },
      data: {
        isVoided: true,
        voidedBy: userId,
        voidedAt: new Date(),
      },
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
