'use strict';

const crypto = require('crypto');
const repository = require('./gift-cards.repository');

function generateCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function list(shopId, query) {
  return repository.findAll(shopId, query);
}

async function getById(shopId, id) {
  const card = await repository.findById(id, shopId);
  if (!card) throw Object.assign(new Error('Gift card not found'), { status: 404 });
  return card;
}

async function create(shopId, data) {
  const code = data.code || generateCode();
  const existing = await repository.findByCode(code, shopId);
  if (existing) throw Object.assign(new Error('Gift card code already exists'), { status: 409 });

  return repository.create({
    ...data,
    code,
    shopId,
    balance: data.initialBalance,
    status: 'ACTIVE',
  });
}

async function redeem(shopId, { code, amount, customerId }) {
  const card = await repository.findByCode(code, shopId);
  if (!card) throw Object.assign(new Error('Gift card not found'), { status: 404 });
  if (card.status !== 'ACTIVE') throw Object.assign(new Error(`Gift card is ${card.status.toLowerCase()}`), { status: 422 });
  if (card.balance < amount) throw Object.assign(new Error(`Insufficient balance. Available: ${card.balance}`), { status: 422 });

  const newBalance = card.balance - amount;
  const status = newBalance === 0 ? 'USED' : 'ACTIVE';

  await repository.update(card.id, shopId, { balance: newBalance, status });
  return repository.findById(card.id, shopId);
}

module.exports = { list, getById, create, redeem };
