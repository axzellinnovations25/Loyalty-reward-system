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

async function create(shopId, data) {
  const [customer, reward] = await Promise.all([
    db.customer.findFirst({ where: { id: data.customerId, shopId } }),
    db.reward.findFirst({ where: { id: data.rewardId, shopId, isActive: true } }),
  ]);

  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  if (!reward) throw Object.assign(new Error('Reward not found or inactive'), { status: 404 });

  const pointsRecord = await db.customerPoints.findUnique({ where: { customerId: data.customerId } });
  const currentPoints = pointsRecord?.points ?? 0;

  if (currentPoints < reward.pointsCost) {
    throw Object.assign(
      new Error(`Insufficient points. Required: ${reward.pointsCost}, Available: ${currentPoints}`),
      { status: 422 }
    );
  }

  await db.$transaction([
    db.redemption.create({ data: { ...data, shopId, pointsSpent: reward.pointsCost } }),
    db.customerPoints.update({
      where: { customerId: data.customerId },
      data: { points: { decrement: reward.pointsCost } },
    }),
  ]);

  return repository.findAll(shopId, { customerId: data.customerId, limit: 1 });
}

module.exports = { list, getById, create };
