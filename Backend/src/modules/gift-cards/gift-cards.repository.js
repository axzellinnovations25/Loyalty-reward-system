'use strict';

const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function findAll(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = { shopId, ...(query.status && { status: query.status }) };

  const [items, total] = await Promise.all([
    db.giftCard.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    db.giftCard.count({ where }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id, shopId) {
  return db.giftCard.findFirst({ where: { id, shopId } });
}

async function findByCode(code, shopId) {
  return db.giftCard.findFirst({ where: { code, shopId } });
}

async function create(data) {
  return db.giftCard.create({ data });
}

async function update(id, shopId, data) {
  return db.giftCard.updateMany({ where: { id, shopId }, data });
}

async function count(shopId) {
  return db.giftCard.count({ where: { shopId } });
}

module.exports = { findAll, findById, findByCode, create, update, count };
