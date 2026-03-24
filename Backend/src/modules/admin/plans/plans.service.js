'use strict';

const repository = require('./plans.repository');
const { flush } = require('../../../services/cache');

async function list() { return repository.findAll(); }

async function getById(id) {
  const plan = await repository.findById(id);
  if (!plan) throw Object.assign(new Error('Plan not found'), { status: 404 });
  return plan;
}

async function create(data) { return repository.create(data); }

async function update(id, data) {
  await getById(id);
  const plan = await repository.update(id, data);
  flush(); // bust all entitlement caches when a plan changes
  return plan;
}

module.exports = { list, getById, create, update };
