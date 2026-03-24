'use strict';

const db = require('../../../config/db');

async function findAll() {
  return db.plan.findMany({ include: { features: true, limits: true }, orderBy: { sortOrder: 'asc' } });
}

async function findById(id) {
  return db.plan.findUnique({ where: { id }, include: { features: true, limits: true } });
}

async function create(data) {
  return db.plan.create({ data, include: { features: true, limits: true } });
}

async function update(id, data) {
  return db.plan.update({ where: { id }, data, include: { features: true, limits: true } });
}

module.exports = { findAll, findById, create, update };
