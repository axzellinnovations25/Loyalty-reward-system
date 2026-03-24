'use strict';

const repository = require('./shops.repository');

async function list(query) { return repository.findAll(query); }

async function getById(id) {
  const shop = await repository.findById(id);
  if (!shop) throw Object.assign(new Error('Shop not found'), { status: 404 });
  return shop;
}

async function update(id, data) {
  await getById(id);
  return repository.update(id, data);
}

module.exports = { list, getById, update };
