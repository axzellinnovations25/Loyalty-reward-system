'use strict';

const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function findAll(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const search = query.search ? { OR: [
    { name: { contains: query.search, mode: 'insensitive' } },
    { phone: { contains: query.search } },
  ]} : {};

  const [items, total] = await Promise.all([
    db.customer.findMany({ where: { shopId, ...search }, skip, take, orderBy: { createdAt: 'desc' } }),
    db.customer.count({ where: { shopId, ...search } }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id, shopId) {
  return db.customer.findFirst({ where: { id, shopId }, include: { points: true } });
}

async function findByPhone(phone, shopId) {
  return db.customer.findFirst({ where: { phone, shopId } });
}

async function create(shopId, data) {
  return db.customer.create({ data: { ...data, shopId } });
}

async function update(id, shopId, data) {
  return db.customer.updateMany({ where: { id, shopId }, data });
}

async function remove(id, shopId) {
  return db.customer.deleteMany({ where: { id, shopId } });
}

async function count(shopId) {
  return db.customer.count({ where: { shopId } });
}

module.exports = { findAll, findById, findByPhone, create, update, remove, count };
