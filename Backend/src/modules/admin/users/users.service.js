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
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const passwordHash = await bcrypt.hash(data.password, 12);
  return repository.create({ ...data, password: undefined, passwordHash });
}

async function update(id, data) {
  await getById(id);
  return repository.update(id, data);
}

module.exports = { list, getById, create, update };
