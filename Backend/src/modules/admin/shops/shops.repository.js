'use strict';

const db = require('../../../config/db');
const { parsePagination, buildMeta } = require('../../../utils/pagination');

async function findAll(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {};

  const [items, total] = await Promise.all([
    db.shop.findMany({ where: search, skip, take, orderBy: { createdAt: 'desc' },
      include: { subscription: { include: { plan: true } } } }),
    db.shop.count({ where: search }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id) {
  return db.shop.findUnique({ where: { id },
    include: { subscription: { include: { plan: true } }, owner: { select: { id: true, name: true, email: true } } } });
}

async function update(id, data) {
  return db.shop.update({ where: { id }, data });
}

module.exports = { findAll, findById, update };
