'use strict';

const db = require('../../../config/db');
const { parsePagination, buildMeta } = require('../../../utils/pagination');

async function findAll(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = query.shopId ? { shopId: query.shopId } : {};

  const [items, total] = await Promise.all([
    db.billingRecord.findMany({ where, skip, take, orderBy: { createdAt: 'desc' },
      include: { shop: { select: { id: true, name: true } } } }),
    db.billingRecord.count({ where }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id) {
  return db.billingRecord.findUnique({ where: { id }, include: { shop: true } });
}

async function create(data) {
  return db.billingRecord.create({ data });
}

async function update(id, data) {
  return db.billingRecord.update({ where: { id }, data });
}

module.exports = { findAll, findById, create, update };
