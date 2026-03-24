'use strict';

const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function findAll(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { shopId, ...(query.isActive !== undefined && { isActive: query.isActive === 'true' }) };

  const [items, total] = await Promise.all([
    db.reward.findMany({ where, skip, take, orderBy: { pointsCost: 'asc' } }),
    db.reward.count({ where }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id, shopId) {
  return db.reward.findFirst({ where: { id, shopId } });
}

async function create(data) {
  return db.reward.create({ data });
}

async function update(id, shopId, data) {
  return db.reward.updateMany({ where: { id, shopId }, data });
}

async function remove(id, shopId) {
  return db.reward.deleteMany({ where: { id, shopId } });
}

module.exports = { findAll, findById, create, update, remove };
