'use strict';

const repository = require('./redemptions.repository');
const db = require('../../config/db');

async function list(shopId, query) {
  return repository.findAll(shopId, query);
}

async function getById(shopId, id) {
  const redemption = await repository.findById(id, shopId);
  if (!redemption) throw Object.assign(new Error('Redemption not found'), { status: 404 });
  return redemption;
}

async function create(shopId, userId, data) {
  const { customerId, pointsRedeemed, billAmount, notes } = data;

  const [customer, settings] = await Promise.all([
    db.customer.findFirst({ where: { id: customerId, shopId } }),
    db.shopSettings.findUnique({ where: { shopId } })
  ]);

  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  if (!settings) throw Object.assign(new Error('Shop settings not found'), { status: 400 });

  const currentPoints = customer.totalPoints;
  if (currentPoints < pointsRedeemed) {
    throw Object.assign(
      new Error(`Insufficient points. Required: ${pointsRedeemed}, Available: ${currentPoints}`),
      { status: 422 }
    );
  }

  if (settings.minRedeemPoints && pointsRedeemed < settings.minRedeemPoints) {
    throw Object.assign(
      new Error(`Minimum points required to redeem is ${settings.minRedeemPoints}`),
      { status: 422 }
    );
  }

  // Calculate discount based on settings
  let discountValue = 0;
  const redemptionRate = Number(settings.redemptionValue); // e.g. 500 (for Flat) or 100 (for %)

  if (settings.maxRedeemMode === 'flat_amount') {
    // Flat Amount Method: redemptionRate points = Rs 1 discount
    discountValue = (pointsRedeemed / redemptionRate);
  } else if (settings.maxRedeemMode === 'percent_of_bill') {
    // Percentage Method: redemptionRate points = 1% discount
    const percentDiscount = (pointsRedeemed / redemptionRate);
    discountValue = (percentDiscount / 100) * billAmount;
  }

  // Enforce Max Redemption Limit if set
  if (settings.maxRedeemValue) {
    const limit = Number(settings.maxRedeemValue);
    if (settings.maxRedeemMode === 'flat_amount' && discountValue > limit) {
      discountValue = limit;
    } else if (settings.maxRedeemMode === 'percent_of_bill') {
      const maxDiscountValue = (limit / 100) * billAmount;
      if (discountValue > maxDiscountValue) {
        discountValue = maxDiscountValue;
      }
    }
  }

  // Ensure discount doesn't exceed the actual bill amount
  if (discountValue > billAmount) discountValue = billAmount;

  await db.$transaction([
    db.redemption.create({ 
      data: { 
        shopId, 
        customerId, 
        userId, 
        pointsRedeemed, 
        discountValue,
        notes 
      } 
    }),
    db.customer.update({
      where: { id: customerId },
      data: { 
        totalPoints: { decrement: pointsRedeemed },
        lastActivityAt: new Date()
      },
    }),
  ]);

  return repository.findAll(shopId, { customerId, limit: 1 });
}

module.exports = { list, getById, create };
