'use strict';

const repository = require('./customers.repository');
const { normalise, isValid } = require('../../utils/phone');

async function list(shopId, query) {
  return repository.findAll(shopId, query);
}

async function getById(shopId, id) {
  const customer = await repository.findById(id, shopId);
  if (!customer) throw Object.assign(new Error('Customer not found'), { status: 404 });
  return customer;
}

async function create(shopId, data) {
  const phone = normalise(data.phone);
  if (!phone) throw Object.assign(new Error('Invalid Sri Lankan phone number'), { status: 400 });

  const existing = await repository.findByPhone(phone, shopId);
  if (existing) throw Object.assign(new Error('A customer with this phone number already exists'), { status: 409 });

  return repository.create(shopId, { ...data, phone });
}

async function update(shopId, id, data) {
  if (data.phone) {
    const phone = normalise(data.phone);
    if (!phone) throw Object.assign(new Error('Invalid Sri Lankan phone number'), { status: 400 });
    data.phone = phone;
  }
  await repository.update(id, shopId, data);
  return repository.findById(id, shopId);
}

async function remove(shopId, id) {
  const result = await repository.remove(id, shopId);
  if (result.count === 0) throw Object.assign(new Error('Customer not found'), { status: 404 });
}

module.exports = { list, getById, create, update, remove };
