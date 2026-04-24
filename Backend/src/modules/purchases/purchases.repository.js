'use strict';

const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function findAll(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { shopId, ...(query.customerId && { customerId: query.customerId }) };

  const [purchases, total] = await Promise.all([
    db.purchase.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    }),
    db.purchase.count({ where }),
  ]);

  // For each purchase, find any redemption by the same customer within ±2 minutes
  const WINDOW_MS = 2 * 60 * 1000;
  const items = await Promise.all(
    purchases.map(async (p) => {
      const windowStart = new Date(new Date(p.createdAt).getTime() - WINDOW_MS);
      const windowEnd   = new Date(new Date(p.createdAt).getTime() + WINDOW_MS);
      const redemption = await db.redemption.findFirst({
        where: {
          shopId,
          customerId: p.customerId,
          isVoided: false,
          createdAt: { gte: windowStart, lte: windowEnd },
        },
        orderBy: { createdAt: 'desc' },
      });
      return { ...p, pointsRedeemed: redemption ? redemption.pointsRedeemed : 0 };
    })
  );

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id, shopId) {
  return db.purchase.findFirst({ where: { id, shopId }, include: { customer: true } });
}

async function create(data) {
  return db.purchase.create({ data, include: { customer: true } });
}

module.exports = { findAll, findById, create };
