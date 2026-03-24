'use strict';

const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function findAll(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { shopId, ...(query.customerId && { customerId: query.customerId }) };

  const [items, total] = await Promise.all([
    db.purchase.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { customer: { select: { id: true, name: true, phone: true } } } }),
    db.purchase.count({ where }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id, shopId) {
  return db.purchase.findFirst({ where: { id, shopId }, include: { customer: true } });
}

async function create(data) {
  return db.purchase.create({ data, include: { customer: true } });
}

module.exports = { findAll, findById, create };
