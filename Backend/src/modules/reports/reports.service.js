'use strict';

const repository = require('./reports.repository');

async function summary(shopId, query) {
  return repository.summary(shopId, query);
}

async function topCustomers(shopId, query) {
  return repository.topCustomers(shopId, query);
}

async function purchasesByDay(shopId, query) {
  return repository.purchasesByDay(shopId, query);
}

module.exports = { summary, topCustomers, purchasesByDay };
