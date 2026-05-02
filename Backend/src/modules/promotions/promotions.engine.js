'use strict';

function toNumber(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function hhmmToMinutes(hhmm) {
  if (!hhmm) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm));
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function isWithinTimeWindow(at, startTime, endTime) {
  const s = hhmmToMinutes(startTime);
  const e = hhmmToMinutes(endTime);
  if (s === null || e === null) return true;
  const now = at.getHours() * 60 + at.getMinutes();
  if (s === e) return true; // all day
  if (s < e) return now >= s && now <= e;
  // overnight window (e.g. 22:00 -> 02:00)
  return now >= s || now <= e;
}

function isPromotionActiveAt(promo, at) {
  if (!promo?.isActive) return false;
  if (promo.deletedAt) return false;
  if (promo.startAt && at < new Date(promo.startAt)) return false;
  if (promo.endAt && at > new Date(promo.endAt)) return false;
  if (Array.isArray(promo.daysOfWeek) && promo.daysOfWeek.length > 0) {
    const dow = at.getDay(); // 0=Sun..6=Sat
    if (!promo.daysOfWeek.includes(dow)) return false;
  }
  if (!isWithinTimeWindow(at, promo.startTime, promo.endTime)) return false;
  return true;
}

function matchScope(itemMeta, config) {
  const productIds = Array.isArray(config?.productIds) ? config.productIds : null;
  const categoryIds = Array.isArray(config?.categoryIds) ? config.categoryIds : null;
  if (productIds && productIds.length > 0) {
    return itemMeta.productId && productIds.includes(itemMeta.productId);
  }
  if (categoryIds && categoryIds.length > 0) {
    return itemMeta.categoryId && categoryIds.includes(itemMeta.categoryId);
  }
  return true; // no filters => match all
}

/**
 * Pure in-memory promotion engine.
 *
 * Inputs
 * - promotions: Promotion[] (already filtered to shop)
 * - items: [{ id, productId?, categoryId?, name, sku?, unitPrice, quantity }]
 * - couponCode?: string
 * - at: Date
 *
 * Output
 * - lineDiscountsByItemId: Map(itemId => discountAmount)
 * - cartDiscount: number
 * - applied: [{ promotionId, name, kind, discountAmount, details }]
 */
function evaluatePromotions({ promotions, items, couponCode, at }) {
  const now = at ?? new Date();
  const normalizedCoupon = couponCode ? String(couponCode).trim().toUpperCase() : null;

  const eligible = (promotions || [])
    .filter((p) => isPromotionActiveAt(p, now))
    .filter((p) => {
      if (!p.couponCode) return true;
      return normalizedCoupon && String(p.couponCode).trim().toUpperCase() === normalizedCoupon;
    })
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

  const lineDiscountById = new Map();
  const applied = [];
  const lockedItems = new Set(); // itemIds which cannot receive more item promos

  const itemDiscountCandidates = eligible.filter((p) =>
    ['item_percent', 'item_amount', 'bogo', 'happy_hour_price'].includes(p.kind),
  );
  const cartDiscountCandidates = eligible.filter((p) => ['cart_percent', 'cart_amount'].includes(p.kind));

  // Helper to add item discount (capped so a line never goes negative)
  function addItemDiscount(item, discount, meta) {
    const base = round2(toNumber(item.unitPrice) * toNumber(item.quantity));
    const prev = toNumber(lineDiscountById.get(item.id) || 0);
    const next = Math.min(base, round2(prev + discount));
    lineDiscountById.set(item.id, next);
    return next - prev;
  }

  // 1) Item-level promotions
  for (const promo of itemDiscountCandidates) {
    const cfg = promo.config || {};

    if (promo.kind === 'happy_hour_price') {
      const fixedPrice = toNumber(cfg.price);
      if (!(fixedPrice > 0)) continue;
      for (const item of items) {
        if (!promo.stackable && lockedItems.has(item.id)) continue;
        if (!matchScope(item, cfg)) continue;
        const currentLineBase = round2(toNumber(item.unitPrice) * toNumber(item.quantity));
        const targetLine = round2(fixedPrice * toNumber(item.quantity));
        const discount = round2(Math.max(0, currentLineBase - targetLine));
        if (discount <= 0) continue;
        const added = addItemDiscount(item, discount, { type: 'happy_hour_price', fixedPrice });
        if (added > 0) {
          applied.push({
            promotionId: promo.id,
            name: promo.name,
            kind: promo.kind,
            discountAmount: round2(added),
            details: { fixedPrice, itemId: item.id },
          });
          if (!promo.stackable) lockedItems.add(item.id);
        }
      }
      continue;
    }

    if (promo.kind === 'item_percent') {
      const percent = toNumber(cfg.percent);
      if (!(percent > 0)) continue;
      for (const item of items) {
        if (!promo.stackable && lockedItems.has(item.id)) continue;
        if (!matchScope(item, cfg)) continue;
        const base = round2(toNumber(item.unitPrice) * toNumber(item.quantity));
        const discount = round2((base * percent) / 100);
        if (discount <= 0) continue;
        const added = addItemDiscount(item, discount);
        if (added > 0) {
          applied.push({
            promotionId: promo.id,
            name: promo.name,
            kind: promo.kind,
            discountAmount: round2(added),
            details: { percent, itemId: item.id },
          });
          if (!promo.stackable) lockedItems.add(item.id);
        }
      }
      continue;
    }

    if (promo.kind === 'item_amount') {
      const amount = toNumber(cfg.amount);
      if (!(amount > 0)) continue;
      for (const item of items) {
        if (!promo.stackable && lockedItems.has(item.id)) continue;
        if (!matchScope(item, cfg)) continue;
        const discount = round2(amount * toNumber(item.quantity));
        if (discount <= 0) continue;
        const added = addItemDiscount(item, discount);
        if (added > 0) {
          applied.push({
            promotionId: promo.id,
            name: promo.name,
            kind: promo.kind,
            discountAmount: round2(added),
            details: { amount, itemId: item.id },
          });
          if (!promo.stackable) lockedItems.add(item.id);
        }
      }
      continue;
    }

    if (promo.kind === 'bogo') {
      const buyQty = Math.max(1, Math.floor(toNumber(cfg.buyQty)));
      const getQty = Math.max(1, Math.floor(toNumber(cfg.getQty)));
      const percentOff = cfg.percentOff == null ? 100 : toNumber(cfg.percentOff);
      if (!(percentOff > 0)) continue;

      for (const item of items) {
        if (!promo.stackable && lockedItems.has(item.id)) continue;
        if (!matchScope(item, cfg)) continue;
        const q = Math.floor(toNumber(item.quantity));
        if (q < buyQty + getQty) continue;
        const group = buyQty + getQty;
        const freeUnits = Math.floor(q / group) * getQty;
        if (freeUnits <= 0) continue;
        const perUnit = toNumber(item.unitPrice);
        const discount = round2(perUnit * freeUnits * (percentOff / 100));
        const added = addItemDiscount(item, discount);
        if (added > 0) {
          applied.push({
            promotionId: promo.id,
            name: promo.name,
            kind: promo.kind,
            discountAmount: round2(added),
            details: { buyQty, getQty, percentOff, itemId: item.id, freeUnits },
          });
          if (!promo.stackable) lockedItems.add(item.id);
        }
      }
      continue;
    }
  }

  // 2) Cart-level promotions (applied on net subtotal after item discounts)
  const subtotal = round2(items.reduce((sum, it) => sum + toNumber(it.unitPrice) * toNumber(it.quantity), 0));
  const itemDiscountTotal = round2([...lineDiscountById.values()].reduce((sum, v) => sum + toNumber(v), 0));
  const net = Math.max(0, round2(subtotal - itemDiscountTotal));

  let cartDiscount = 0;
  for (const promo of cartDiscountCandidates) {
    const cfg = promo.config || {};
    const minSubtotal = cfg.minSubtotal == null ? null : toNumber(cfg.minSubtotal);
    if (minSubtotal !== null && net < minSubtotal) continue;

    if (promo.kind === 'cart_amount') {
      const amount = toNumber(cfg.amount);
      if (!(amount > 0)) continue;
      const discount = Math.min(net - cartDiscount, amount);
      if (discount <= 0) continue;
      cartDiscount = round2(cartDiscount + discount);
      applied.push({
        promotionId: promo.id,
        name: promo.name,
        kind: promo.kind,
        discountAmount: round2(discount),
        details: { amount, minSubtotal },
      });
      if (!promo.stackable) break;
      continue;
    }

    if (promo.kind === 'cart_percent') {
      const percent = toNumber(cfg.percent);
      if (!(percent > 0)) continue;
      const maxDiscount = cfg.maxDiscount == null ? null : toNumber(cfg.maxDiscount);
      let discount = round2(((net - cartDiscount) * percent) / 100);
      if (maxDiscount !== null) discount = Math.min(discount, maxDiscount);
      discount = Math.min(discount, net - cartDiscount);
      if (discount <= 0) continue;
      cartDiscount = round2(cartDiscount + discount);
      applied.push({
        promotionId: promo.id,
        name: promo.name,
        kind: promo.kind,
        discountAmount: round2(discount),
        details: { percent, maxDiscount, minSubtotal },
      });
      if (!promo.stackable) break;
      continue;
    }
  }

  const discountTotal = round2(itemDiscountTotal + cartDiscount);
  const total = round2(Math.max(0, subtotal - discountTotal));

  return {
    subtotal,
    itemDiscountTotal,
    cartDiscount,
    discountTotal,
    total,
    lineDiscountById,
    applied,
  };
}

module.exports = { evaluatePromotions, round2, toNumber, isPromotionActiveAt };
