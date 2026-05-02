'use strict';

const assert = require('assert');
const { evaluatePromotions } = require('./promotions.engine');

function promo(overrides) {
  return {
    id: overrides.id || 'p1',
    name: overrides.name || 'Promo',
    kind: overrides.kind,
    isActive: overrides.isActive ?? true,
    deletedAt: null,
    priority: overrides.priority ?? 100,
    stackable: overrides.stackable ?? false,
    startAt: overrides.startAt ?? null,
    endAt: overrides.endAt ?? null,
    daysOfWeek: overrides.daysOfWeek ?? [],
    startTime: overrides.startTime ?? null,
    endTime: overrides.endTime ?? null,
    couponCode: overrides.couponCode ?? null,
    config: overrides.config || {},
  };
}

function item(id, unitPrice, quantity, extra = {}) {
  return { id, unitPrice, quantity, productId: extra.productId ?? null, categoryId: extra.categoryId ?? null, name: extra.name ?? id, sku: null };
}

(() => {
  // Cart 10% off
  const r = evaluatePromotions({
    promotions: [promo({ id: 'c10', kind: 'cart_percent', config: { percent: 10 } })],
    items: [item('a', 1000, 1)],
    couponCode: null,
    at: new Date(),
  });
  assert.equal(r.subtotal, 1000);
  assert.equal(r.discountTotal, 100);
  assert.equal(r.total, 900);
})();

(() => {
  // BOGO buy2 get1 free
  const r = evaluatePromotions({
    promotions: [promo({ id: 'bogo', kind: 'bogo', config: { buyQty: 2, getQty: 1, percentOff: 100 } })],
    items: [item('a', 100, 3)],
    couponCode: null,
    at: new Date(),
  });
  assert.equal(r.subtotal, 300);
  assert.equal(r.discountTotal, 100);
  assert.equal(r.total, 200);
})();

(() => {
  // Coupon gate
  const r1 = evaluatePromotions({
    promotions: [promo({ id: 'cp', kind: 'cart_amount', couponCode: 'SAVE', config: { amount: 50 } })],
    items: [item('a', 100, 1)],
    couponCode: null,
    at: new Date(),
  });
  assert.equal(r1.discountTotal, 0);
  const r2 = evaluatePromotions({
    promotions: [promo({ id: 'cp', kind: 'cart_amount', couponCode: 'SAVE', config: { amount: 50 } })],
    items: [item('a', 100, 1)],
    couponCode: 'SAVE',
    at: new Date(),
  });
  assert.equal(r2.discountTotal, 50);
})();

console.log('promotions.engine tests: ok');

