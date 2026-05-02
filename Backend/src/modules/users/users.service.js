'use strict';

const bcrypt = require('bcryptjs');
const repository = require('./users.repository');
const entitlements = require('../../services/entitlements');

async function assertOwner(shopId, requestingUserId) {
  const owner = await repository.findOwner(shopId);
  if (!owner) throw Object.assign(new Error('Owner not found'), { status: 404 });
  if (owner.id !== requestingUserId) throw Object.assign(new Error('Only the shop owner can manage staff'), { status: 403 });
  return owner;
}

async function list(shopId, requestingUserId) {
  const owner = await repository.findOwner(shopId);
  const users = await repository.listByShop(shopId);
  return users.map((u) => ({ ...u, role: owner && u.id === owner.id ? 'owner' : 'staff' }));
}

async function create(shopId, requestingUserId, data) {
  await assertOwner(shopId, requestingUserId);

  const username = String(data.username).trim().toLowerCase();
  const existing = await repository.findByUsername(username);
  if (existing) throw Object.assign(new Error('Username already in use'), { status: 409 });

  const [currentCount, maxUsers] = await Promise.all([
    repository.countActive(shopId),
    entitlements.getLimit(shopId, 'max_users'),
  ]);
  if (maxUsers !== -1 && currentCount >= maxUsers) {
    throw Object.assign(new Error(`Staff account limit reached (${maxUsers}). Please upgrade your plan.`), { status: 403 });
  }

  const passwordValue = String(data.password ?? '').trim();
  const passwordHash = await bcrypt.hash(passwordValue, 12);
  return repository.create(shopId, { name: data.name.trim(), username, passwordHash });
}

async function update(shopId, requestingUserId, id, data) {
  const owner = await assertOwner(shopId, requestingUserId);
  if (id === owner.id && data.isActive === false) throw Object.assign(new Error('Cannot deactivate owner'), { status: 400 });

  const user = await repository.findById(shopId, id);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  if (data.username) {
    const username = String(data.username).trim().toLowerCase();
    if (username !== user.username) {
      const existing = await repository.findByUsername(username);
      if (existing) throw Object.assign(new Error('Username already in use'), { status: 409 });
    }
    data.username = username;
  }

  await repository.update(shopId, id, data);
  const users = await list(shopId, requestingUserId);
  return users.find((u) => u.id === id);
}

async function resetPassword(shopId, requestingUserId, id, { newPassword }) {
  const owner = await assertOwner(shopId, requestingUserId);
  if (id === owner.id) throw Object.assign(new Error('Owner password should be changed from profile'), { status: 400 });

  const user = await repository.findById(shopId, id);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const passwordValue = String(newPassword ?? '').trim();
  const passwordHash = await bcrypt.hash(passwordValue, 12);
  const result = await repository.setPassword(shopId, id, passwordHash);
  if (result.count === 0) throw Object.assign(new Error('User not found'), { status: 404 });
}

async function deactivate(shopId, requestingUserId, id) {
  const owner = await assertOwner(shopId, requestingUserId);
  if (id === owner.id) throw Object.assign(new Error('Cannot deactivate owner'), { status: 400 });

  const result = await repository.update(shopId, id, { isActive: false });
  if (result.count === 0) throw Object.assign(new Error('User not found'), { status: 404 });
}

module.exports = { list, create, update, resetPassword, deactivate };
