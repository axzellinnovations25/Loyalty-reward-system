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
  const existing = await db.user.findUnique({ 
    where: { username: data.username } 
  });
  if (existing) throw Object.assign(new Error('Username is already taken'), { status: 409 });

  const passwordHash = await bcrypt.hash(data.password, 12);
  const { password, ...userData } = data;
  return repository.create({ ...userData, passwordHash });
}

async function update(id, data) {
  await getById(id);
  return repository.update(id, data);
}

module.exports = { list, getById, create, update };
