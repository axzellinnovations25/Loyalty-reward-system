'use strict';

const repository = require('./rewards.repository');

async function list(shopId, query) { return repository.findAll(shopId, query); }

async function getById(shopId, id) {
  const reward = await repository.findById(id, shopId);
  if (!reward) throw Object.assign(new Error('Reward not found'), { status: 404 });
  return reward;
}

async function create(shopId, data) {
  return repository.create({ ...data, shopId });
}

async function update(shopId, id, data) {
  await getById(shopId, id);
  await repository.update(id, shopId, data);
  return repository.findById(id, shopId);
}

async function remove(shopId, id) {
  const result = await repository.remove(id, shopId);
  if (result.count === 0) throw Object.assign(new Error('Reward not found'), { status: 404 });
}

module.exports = { list, getById, create, update, remove };
