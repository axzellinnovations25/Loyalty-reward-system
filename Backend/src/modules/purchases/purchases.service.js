'use strict';

const repository = require('./purchases.repository');
const db = require('../../config/db');

async function list(shopId, query) {
  return repository.findAll(shopId, query);
}

async function getById(shopId, id) {
  const purchase = await repository.findById(id, shopId);
  if (!purchase) throw Object.assign(new Error('Purchase not found'), { status: 404 });
  return purchase;
}

/**
 * Records a purchase and awards loyalty points based on the shop's points rule.
 */
async function create(shopId, data) {
  const customer = await db.customer.findFirst({ where: { id: data.customerId, shopId } });
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });

  const settings = await db.shopSettings.findUnique({ where: { shopId } });
  const pointsPerUnit = settings?.pointsPerCurrencyUnit ?? 1;
  const pointsEarned = Math.floor(data.amount * pointsPerUnit);

  const purchase = await db.$transaction(async (tx) => {
    const p = await tx.purchase.create({ data: { ...data, shopId, pointsEarned } });
    await tx.customerPoints.upsert({
      where: { customerId: data.customerId },
      update: { points: { increment: pointsEarned } },
      create: { customerId: data.customerId, shopId, points: pointsEarned },
    });
    return p;
  });

  return repository.findById(purchase.id, shopId);
}

module.exports = { list, getById, create };
