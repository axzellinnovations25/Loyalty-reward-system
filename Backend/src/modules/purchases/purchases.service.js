'use strict';

const repository = require('./purchases.repository');
const db = require('../../config/db');
const promotionsService = require('../promotions/promotions.service');

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

  const items = Array.isArray(data.items) ? data.items : null;
  const couponCode = data.couponCode ? String(data.couponCode).trim().toUpperCase() : null;

  const computedAmount = items
    ? items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0)
    : Number(data.amount);

  if (!Number.isFinite(computedAmount) || computedAmount <= 0) {
    throw Object.assign(new Error('Invalid purchase amount'), { status: 400 });
  }

  // Manager override check (price overrides)
  if (items) {
    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
    if (productIds.length > 0) {
      const products = await db.product.findMany({
        where: { shopId, id: { in: productIds } },
        select: { id: true, price: true },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      const hasOverride = items.some((it) => {
        if (!it.productId) return false;
        const p = byId.get(it.productId);
        if (!p) return false;
        const expected = Number(p.price);
        const given = Number(it.unitPrice);
        if (!Number.isFinite(expected) || !Number.isFinite(given)) return false;
        return Math.abs(expected - given) > 0.009;
      });

      if (hasOverride) {
        if (!data.managerPassword) {
          throw Object.assign(new Error('Manager password required for price override'), { status: 403 });
        }
        const ok = await promotionsService.verifyOwnerPassword(shopId, data.managerPassword);
        if (!ok) throw Object.assign(new Error('Invalid manager password'), { status: 403 });
      }
    }
  }

  // Points are calculated from the final (net) amount (after promotions).
  // For legacy `amount` purchases, that is `computedAmount`.

  const purchase = await db.$transaction(async (tx) => {
    const txProductIds = items ? [...new Set(items.map((i) => i.productId).filter(Boolean))] : [];
    const txProducts = txProductIds.length
      ? await tx.product.findMany({ where: { shopId, id: { in: txProductIds } }, select: { id: true, price: true } })
      : [];
    const txProductById = new Map(txProducts.map((p) => [p.id, p]));

    let perLineDiscountTotal = [];
    let lineSubtotals = [];
    let appliedPromotions = [];
    let subtotal = computedAmount;
    let discountTotal = 0;
    let finalAmount = computedAmount;
    if (items) {
      const applied = await promotionsService.applyToPurchaseTx(tx, shopId, data.customerId, {
        items,
        couponCode,
        at: new Date(),
      });
      perLineDiscountTotal = applied.perLineDiscountTotal;
      lineSubtotals = applied.lineSubtotals;
      appliedPromotions = applied.appliedPromotions;
      subtotal = applied.totals.subtotal;
      discountTotal = applied.totals.discountTotal;
      finalAmount = applied.totals.total;
    }

    const pointsEarned = Math.floor(finalAmount / pointsPerUnit);

    const p = await tx.purchase.create({
      data: {
        shopId,
        customerId: data.customerId,
        userId: data.userId,
        subtotal,
        discountTotal,
        amount: finalAmount,
        pointsEarned,
        ...(items
          ? {
              items: {
                create: items.map((it, idx) => {
                  const lineSubtotal = Number(lineSubtotals[idx] ?? Number(it.unitPrice) * Number(it.quantity));
                  const discountAmount = Number(perLineDiscountTotal[idx] ?? 0);
                  const lineTotal = Math.max(0, lineSubtotal - discountAmount);
                  const qty = Number(it.quantity);
                  const finalUnit = qty > 0 ? lineTotal / qty : Number(it.unitPrice);
                  const originalUnitPrice = it.productId ? Number(txProductById.get(it.productId)?.price ?? it.unitPrice) : null;
                  return {
                    productId: it.productId || null,
                    name: it.name,
                    sku: it.sku || null,
                    originalUnitPrice,
                    unitPrice: it.unitPrice,
                    discountAmount,
                    finalUnitPrice: finalUnit,
                    quantity: it.quantity,
                    lineTotal,
                  };
                }),
              },
            }
          : {}),
      },
    });

    // Save promotion breakdown + bump usage counts
    if (items && Array.isArray(appliedPromotions) && appliedPromotions.length > 0) {
      const byPromo = new Map();
      for (const a of appliedPromotions) {
        if (!a.promotionId) continue;
        const key = a.promotionId;
        const prev = byPromo.get(key) || { ...a, discountAmount: 0 };
        prev.discountAmount = Number(prev.discountAmount) + Number(a.discountAmount || 0);
        byPromo.set(key, prev);
      }

      const rows = [...byPromo.values()].filter((r) => Number(r.discountAmount) > 0);
      if (rows.length > 0) {
        await tx.purchasePromotion.createMany({
          data: rows.map((r) => ({
            purchaseId: p.id,
            promotionId: r.promotionId,
            nameSnapshot: r.name,
            kindSnapshot: r.kind,
            couponCode: couponCode || null,
            discountAmount: r.discountAmount,
            details: r.details || null,
          })),
        });

        await tx.promotion.updateMany({
          where: { id: { in: rows.map((r) => r.promotionId) } },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

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
