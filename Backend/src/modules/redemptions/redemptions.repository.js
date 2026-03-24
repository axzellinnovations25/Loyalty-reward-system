'use strict';

const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function findAll(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { shopId, ...(query.customerId && { customerId: query.customerId }) };

  const [items, total] = await Promise.all([
    db.redemption.findMany({ where, skip, take, orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, phone: true } }, reward: true } }),
    db.redemption.count({ where }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id, shopId) {
  return db.redemption.findFirst({ where: { id, shopId }, include: { customer: true, reward: true } });
}

async function create(data) {
  return db.redemption.create({ data, include: { customer: true, reward: true } });
}

module.exports = { findAll, findById, create };
