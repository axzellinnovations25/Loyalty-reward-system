'use strict';

const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const repository = require('./promotions.repository');
const { evaluatePromotions, toNumber, round2 } = require('./promotions.engine');

async function list(shopId) {
  return repository.findAll(shopId);
}

async function getById(shopId, id) {
  const promo = await repository.findById(shopId, id);
  if (!promo) throw Object.assign(new Error('Promotion not found'), { status: 404 });
  return promo;
}

async function create(shopId, data) {
  const couponCode = data.couponCode ? String(data.couponCode).trim().toUpperCase() : null;
  return repository.create({
    shopId,
    name: data.name,
    description: data.description || null,
    kind: data.kind,
    isActive: data.isActive ?? true,
    priority: data.priority ?? 100,
    stackable: data.stackable ?? false,
    startAt: data.startAt ? new Date(data.startAt) : null,
    endAt: data.endAt ? new Date(data.endAt) : null,
    daysOfWeek: Array.isArray(data.daysOfWeek) ? data.daysOfWeek : [],
    startTime: data.startTime ? String(data.startTime) : null,
    endTime: data.endTime ? String(data.endTime) : null,
    couponCode,
    usageLimit: data.usageLimit ?? null,
    perCustomerLimit: data.perCustomerLimit ?? null,
    config: data.config || {},
  });
}

async function update(shopId, id, data) {
  const existing = await repository.findById(shopId, id);
  if (!existing) throw Object.assign(new Error('Promotion not found'), { status: 404 });
  const couponCode = data.couponCode !== undefined ? (data.couponCode ? String(data.couponCode).trim().toUpperCase() : null) : undefined;
  return repository.update(shopId, id, {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.description !== undefined ? { description: data.description || null } : {}),
    ...(data.kind !== undefined ? { kind: data.kind } : {}),
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    ...(data.priority !== undefined ? { priority: data.priority } : {}),
    ...(data.stackable !== undefined ? { stackable: data.stackable } : {}),
    ...(data.startAt !== undefined ? { startAt: data.startAt ? new Date(data.startAt) : null } : {}),
    ...(data.endAt !== undefined ? { endAt: data.endAt ? new Date(data.endAt) : null } : {}),
    ...(data.daysOfWeek !== undefined ? { daysOfWeek: Array.isArray(data.daysOfWeek) ? data.daysOfWeek : [] } : {}),
    ...(data.startTime !== undefined ? { startTime: data.startTime ? String(data.startTime) : null } : {}),
    ...(data.endTime !== undefined ? { endTime: data.endTime ? String(data.endTime) : null } : {}),
    ...(couponCode !== undefined ? { couponCode } : {}),
    ...(data.usageLimit !== undefined ? { usageLimit: data.usageLimit ?? null } : {}),
    ...(data.perCustomerLimit !== undefined ? { perCustomerLimit: data.perCustomerLimit ?? null } : {}),
    ...(data.config !== undefined ? { config: data.config || {} } : {}),
  });
}

async function remove(shopId, id) {
  const existing = await repository.findById(shopId, id);
  if (!existing) throw Object.assign(new Error('Promotion not found'), { status: 404 });
  return repository.softDelete(shopId, id);
}

async function preview(shopId, { items, couponCode, at }) {
  const promos = await repository.findActive(shopId);
  const cartItems = (items || []).map((it, idx) => ({
    id: it.id || String(idx),
    productId: it.productId || null,
    categoryId: it.categoryId || null,
    name: it.name,
    sku: it.sku || null,
    unitPrice: toNumber(it.unitPrice),
    quantity: Math.floor(toNumber(it.quantity)),
  }));

  return evaluatePromotions({ promotions: promos, items: cartItems, couponCode, at: at ? new Date(at) : new Date() });
}

async function verifyOwnerPassword(shopId, password) {
  const owner = await db.user.findFirst({ where: { shopId }, orderBy: { createdAt: 'asc' } });
  if (!owner) throw Object.assign(new Error('Owner account not found'), { status: 400 });
  const ok = await bcrypt.compare(String(password ?? '').trim(), owner.passwordHash);
  return ok;
}

async function applyToPurchaseTx(tx, shopId, customerId, { items, couponCode, at }) {
  if (!tx?.promotion || !tx?.purchasePromotion) {
    throw Object.assign(new Error('Backend Prisma client is out of date (run prisma generate and restart server)'), {
      status: 503,
    });
  }
  // Load promotions
  const promos = await tx.promotion.findMany({
    where: { shopId, deletedAt: null, isActive: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  });

  // Load products for metadata (categoryId) and for override detection
  const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
  const products = productIds.length
    ? await tx.product.findMany({ where: { shopId, id: { in: productIds } }, select: { id: true, categoryId: true, price: true } })
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  const cartItems = items.map((it, idx) => {
    const p = it.productId ? byId.get(it.productId) : null;
    return {
      id: String(idx),
      productId: it.productId || null,
      categoryId: p?.categoryId || null,
      name: it.name,
      sku: it.sku || null,
      unitPrice: toNumber(it.unitPrice),
      quantity: Math.floor(toNumber(it.quantity)),
    };
  });

  const res = evaluatePromotions({
    promotions: promos,
    items: cartItems,
    couponCode,
    at: at ? new Date(at) : new Date(),
  });

  // Enforce usage limits at purchase time (preview ignores).
  const usedPromoIds = [...new Set((res.applied || []).map((a) => a.promotionId).filter(Boolean))];
  if (usedPromoIds.length > 0) {
    const usedPromos = promos.filter((p) => usedPromoIds.includes(p.id));
    for (const p of usedPromos) {
      if (p.usageLimit != null && p.usedCount >= p.usageLimit) {
        throw Object.assign(new Error(`Promotion usage limit reached: ${p.name}`), { status: 400 });
      }
      if (p.perCustomerLimit != null) {
        const usedByCustomer = await tx.purchasePromotion.count({
          where: { promotionId: p.id, purchase: { customerId } },
        });
        if (usedByCustomer >= p.perCustomerLimit) {
          throw Object.assign(new Error(`Promotion limit reached for customer: ${p.name}`), { status: 400 });
        }
      }
    }
  }

  // Allocate cart discount proportionally across lines for storage
  const lineSubtotals = cartItems.map((it) => round2(it.unitPrice * it.quantity));
  const lineItemDiscounts = cartItems.map((it) => toNumber(res.lineDiscountById.get(it.id) || 0));
  const netLineTotals = lineSubtotals.map((s, i) => Math.max(0, round2(s - lineItemDiscounts[i])));
  const netSubtotal = netLineTotals.reduce((a, b) => a + b, 0);

  const cartDiscountAlloc = netLineTotals.map((_v) => 0);
  if (res.cartDiscount > 0 && netSubtotal > 0) {
    let remaining = res.cartDiscount;
    for (let i = 0; i < netLineTotals.length; i++) {
      const share = i === netLineTotals.length - 1 ? remaining : round2((netLineTotals[i] / netSubtotal) * res.cartDiscount);
      const capped = Math.min(netLineTotals[i], share);
      cartDiscountAlloc[i] = capped;
      remaining = round2(remaining - capped);
    }
  }

  const perLineDiscountTotal = lineItemDiscounts.map((d, i) => round2(d + cartDiscountAlloc[i]));

  return {
    totals: {
      subtotal: res.subtotal,
      discountTotal: res.discountTotal,
      total: res.total,
    },
    appliedPromotions: res.applied,
    perLineDiscountTotal,
    lineSubtotals,
  };
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  preview,
  verifyOwnerPassword,
  applyToPurchaseTx,
};
