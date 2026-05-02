'use strict';

const db = require('../../config/db');

async function findOwner(shopId) {
  return db.user.findFirst({ where: { shopId }, orderBy: { createdAt: 'asc' } });
}

async function listByShop(shopId) {
  return db.user.findMany({
    where: { shopId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      shopId: true,
      name: true,
      username: true,
      isActive: true,
      forcePasswordChange: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

async function findById(shopId, id) {
  return db.user.findFirst({ where: { id, shopId } });
}

async function findByUsername(username) {
  return db.user.findUnique({ where: { username } });
}

async function create(shopId, { name, username, passwordHash }) {
  return db.user.create({
    data: {
      shopId,
      name,
      username,
      passwordHash,
      forcePasswordChange: true,
      isActive: true,
    },
    select: {
      id: true,
      shopId: true,
      name: true,
      username: true,
      isActive: true,
      forcePasswordChange: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

async function update(shopId, id, data) {
  return db.user.updateMany({ where: { id, shopId }, data });
}

async function setPassword(shopId, id, passwordHash) {
  return db.user.updateMany({
    where: { id, shopId },
    data: { passwordHash, forcePasswordChange: true },
  });
}

async function countActive(shopId) {
  return db.user.count({ where: { shopId, isActive: true } });
}

module.exports = { findOwner, listByShop, findById, findByUsername, create, update, setPassword, countActive };

