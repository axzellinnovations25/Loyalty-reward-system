'use strict';

const db = require('../../../config/db');
const { parsePagination, buildMeta } = require('../../../utils/pagination');

async function findAll(query) {
  const { skip, take, page, limit } = parsePagination(query);
  const where = {};
  if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

  const [items, total] = await Promise.all([
    db.shop.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    }),
    db.shop.count({ where }),
  ]);

  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id) {
  return db.shop.findUnique({
    where: { id },
    include: { plan: true, settings: true },
  });
}

const bcrypt = require('bcryptjs');

async function create({ 
  name, email, phone, planId, planAssignedBy,
  ownerName, ownerUsername, ownerPassword 
}) {
  return db.$transaction(async (tx) => {
    // 1. Create the shop
    const shop = await tx.shop.create({
      data: {
        name,
        email,
        phone: phone || null,
        planId,
        planAssignedAt: new Date(),
        planAssignedBy: planAssignedBy || null,
      },
    });

    // 2. Create default settings for the new shop
    await tx.shopSettings.create({
      data: { shopId: shop.id },
    });

    // 3. Create the owner user — force password change on first login
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    await tx.user.create({
      data: {
        shopId: shop.id,
        name: ownerName,
        username: ownerUsername,
        passwordHash,
        isActive: true,
        forcePasswordChange: true,
      },
    });

    return tx.shop.findUnique({
      where: { id: shop.id },
      include: { plan: true },
    });
  });
}

async function update(id, data) {
  return db.shop.update({ where: { id }, data, include: { plan: true } });
}

module.exports = { findAll, findById, create, update };
