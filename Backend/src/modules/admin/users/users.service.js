'use strict';

const bcrypt = require('bcryptjs');
const repository = require('./users.repository');
const db = require('../../../config/db');

async function list(query) { return repository.findAll(query); }

async function getById(id) {
  const user = await repository.findById(id);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return user;
}

async function create(data) {
  // Admin can only create the shop owner account.
  // Staff members are managed exclusively by the shop owner.
  if (data.shopId) {
    const existingOwner = await repository.findOwner(data.shopId);
    if (existingOwner) {
      throw Object.assign(
        new Error('This shop already has an owner account. Staff accounts are managed by the shop owner, not the admin.'),
        { status: 409 }
      );
    }
  }

  const existing = await db.user.findUnique({ 
    where: { username: data.username } 
  });
  if (existing) throw Object.assign(new Error('Username is already taken'), { status: 409 });

  const passwordHash = await bcrypt.hash(data.password, 12);
  const { password, ...userData } = data;
  return repository.create({ ...userData, passwordHash, forcePasswordChange: true });
}

async function update(id, data) {
  const user = await getById(id);

  // Admin can only toggle the owner account, not staff accounts.
  // Staff accounts are managed by the shop owner.
  if (data.isActive === true) {
    const shop = await db.shop.findUnique({ where: { id: user.shopId } });
    if (!shop || !shop.isActive) {
      throw Object.assign(new Error('Cannot activate the owner account while the shop is disabled'), { status: 400 });
    }
  }

  return repository.update(id, data);
}

async function resetPassword(id, newPassword) {
  await getById(id);
  const passwordHash = await bcrypt.hash(newPassword, 12);
  return repository.update(id, { passwordHash, forcePasswordChange: true });
}

module.exports = { list, getById, create, update, resetPassword };
