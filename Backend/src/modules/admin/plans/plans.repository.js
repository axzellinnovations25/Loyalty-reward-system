'use strict';

const db = require('../../../config/db');

async function findAll() {
  return db.plan.findMany({ include: { features: true } });
}

async function findById(id) {
  return db.plan.findUnique({ where: { id }, include: { features: true } });
}

async function create(data) {
  return db.plan.create({ data, include: { features: true } });
}

async function update(id, data) {
  return db.plan.update({ where: { id }, data, include: { features: true } });
}

module.exports = { findAll, findById, create, update };
