'use strict';

const db = require('../../../config/db');
const { parsePagination, buildMeta } = require('../../../utils/pagination');

const SELECT = { id: true, name: true, shopId: true, isActive: true, createdAt: true, username: true, forcePasswordChange: true };

/**
 * For the admin panel, only the shop owner (first created user) is returned.
 * Staff members created by the shop owner are excluded — they are managed
 * internally by the shop owner and should not be visible to the system admin.
 */
async function findAll(query) {
  const { skip, take, page, limit } = parsePagination(query);

  if (query.shopId) {
    // Return only the owner (earliest createdAt) for a specific shop.
    const owner = await db.user.findFirst({
      where: { shopId: query.shopId },
      orderBy: { createdAt: 'asc' },
      select: SELECT,
    });
    const items = owner ? [owner] : [];
    return { items, meta: buildMeta(items.length, 1, items.length || 1) };
  }

  // No shopId filter — return one owner per shop (used for cross-shop listings).
  const where = {};
  const [items, total] = await Promise.all([
    db.user.findMany({ where, skip, take, select: SELECT, orderBy: { createdAt: 'asc' } }),
    db.user.count({ where }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

/**
 * Returns the owner (first user) of a given shop.
 */
async function findOwner(shopId) {
  return db.user.findFirst({
    where: { shopId },
    orderBy: { createdAt: 'asc' },
    select: SELECT,
  });
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

module.exports = { findAll, findOwner, findById, create, update };
