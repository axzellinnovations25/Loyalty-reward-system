'use strict';

const db = require('../../../config/db');
const { parsePagination, buildMeta } = require('../../../utils/pagination');

const SELECT = { id: true, name: true, email: true, role: true, shopId: true, isActive: true, createdAt: true };

async function findAll(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = query.shopId ? { shopId: query.shopId } : {};

  const [items, total] = await Promise.all([
    db.user.findMany({ where, skip, take, select: SELECT, orderBy: { createdAt: 'desc' } }),
    db.user.count({ where }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id) {
  return db.user.findUnique({ where: { id }, select: SELECT });
}

async function create(data) {
  return db.user.create({ data, select: SELECT });
}

async function update(id, data) {
  return db.user.update({ where: { id }, data, select: SELECT });
}

module.exports = { findAll, findById, create, update };
