'use strict';

const db = require('../../config/db');

function requirePromotionModel(client) {
  // If Prisma Client was not regenerated after adding Promotion, this will be undefined,
  // and callers will otherwise crash with a 500 TypeError.
  if (!client?.promotion) {
    throw Object.assign(new Error('Backend Prisma client is out of date (run prisma generate and restart server)'), {
      status: 503,
    });
  }
  return client.promotion;
}

function findAll(shopId) {
  return requirePromotionModel(db).findMany({
    where: { shopId, deletedAt: null },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  });
}

function findActive(shopId) {
  return requirePromotionModel(db).findMany({
    where: { shopId, deletedAt: null, isActive: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  });
}

function findById(shopId, id) {
  return requirePromotionModel(db).findFirst({ where: { id, shopId, deletedAt: null } });
}

function create(data) {
  return requirePromotionModel(db).create({ data });
}

function update(shopId, id, data) {
  // `id` is globally unique; shopId is validated in service via findById().
  return requirePromotionModel(db).update({ where: { id }, data });
}

function softDelete(shopId, id) {
  // `id` is globally unique; shopId is validated in service via findById().
  return requirePromotionModel(db).update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
}

module.exports = { findAll, findActive, findById, create, update, softDelete };
