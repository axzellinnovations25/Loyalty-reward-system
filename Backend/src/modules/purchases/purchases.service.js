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
  const pointsPerUnit = settings?.pointsPerAmount ? Number(settings.pointsPerAmount) : 100;
  const pointsEarned = Math.floor(data.amount / pointsPerUnit);

  const purchase = await db.$transaction(async (tx) => {
    const p = await tx.purchase.create({ data: { ...data, shopId, pointsEarned } });
    await tx.customer.update({
      where: { id: data.customerId },
      data: { 
        totalPoints: { increment: pointsEarned },
        lastActivityAt: new Date()
      },
    });
    return p;
  });

  const savedPurchase = await repository.findById(purchase.id, shopId);



  return savedPurchase;
}

async function voidPurchase(shopId, id, userId) {
  const purchase = await db.purchase.findUnique({ where: { id, shopId }, include: { customer: true } });
  if (!purchase) throw Object.assign(new Error('Purchase not found'), { status: 404 });
  if (purchase.isVoided) throw Object.assign(new Error('Purchase is already voided'), { status: 400 });

  return db.$transaction(async (tx) => {
    const updatedPurchase = await tx.purchase.update({
      where: { id },
      data: {
        isVoided: true,
        voidedBy: userId,
        voidedAt: new Date(),
      },
    });

    const currentPoints = purchase.customer.totalPoints;
    const newPoints = Math.max(0, currentPoints - purchase.pointsEarned);

    await tx.customer.update({
      where: { id: purchase.customerId },
      data: {
        totalPoints: newPoints,
      },
    });

    await tx.auditLog.create({
      data: {
        shopId,
        userId,
        action: 'VOID_PURCHASE',
        entityType: 'PURCHASE',
        entityId: id,
        details: { pointsReversed: purchase.pointsEarned, amountReversed: Number(purchase.amount) }
      }
    });

    return updatedPurchase;
  });
}

module.exports = { list, getById, create, voidPurchase };
