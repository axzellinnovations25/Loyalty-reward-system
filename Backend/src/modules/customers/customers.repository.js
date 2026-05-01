'use strict';

const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function findAll(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  let search = {};
  if (query.search) {
    const { normalise } = require('../../utils/phone');
    const normalised = normalise(query.search);
    const conditions = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search } },
    ];

    // If search starts with '0' followed by digits, try searching without the '0'
    if (query.search.startsWith('0') && query.search.length > 1) {
      conditions.push({ phone: { contains: query.search.slice(1) } });
    }

    // If we have a full valid normalized number, search for that too
    if (normalised) {
      conditions.push({ phone: { contains: normalised } });
    }

    search = { OR: conditions };
  }

  const [items, total] = await Promise.all([
    db.customer.findMany({ where: { shopId, deletedAt: null, ...search }, skip, take, orderBy: { createdAt: 'desc' } }),
    db.customer.count({ where: { shopId, deletedAt: null, ...search } }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id, shopId) {
  return db.customer.findFirst({ 
    where: { id, shopId, deletedAt: null },
    include: {
      purchases: {
        orderBy: { createdAt: 'desc' },
        take: 50
      },
      redemptions: {
        orderBy: { createdAt: 'desc' },
        take: 50
      }
    }
  });
}

async function findByPhone(phone, shopId) {
  return db.customer.findFirst({ where: { phone, shopId, deletedAt: null } });
}

async function create(shopId, data) {
  return db.customer.create({ data: { ...data, shopId } });
}

async function update(id, shopId, data) {
  return db.customer.updateMany({ where: { id, shopId }, data });
}

async function remove(id, shopId) {
  const customer = await db.customer.findFirst({ where: { id, shopId, deletedAt: null } });
  if (!customer) return { count: 0 };
  
  // Soft delete and prefix the phone number to free up the unique constraint
  return db.customer.updateMany({ 
    where: { id, shopId },
    data: { 
      deletedAt: new Date(),
      phone: `del_${Date.now()}_${customer.phone}`
    } 
  });
}

async function count(shopId) {
  return db.customer.count({ where: { shopId, deletedAt: null } });
}

module.exports = { findAll, findById, findByPhone, create, update, remove, count };
