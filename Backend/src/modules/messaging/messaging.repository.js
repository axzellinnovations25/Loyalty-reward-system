'use strict';

const db = require('../../config/db');
const { parsePagination, buildMeta } = require('../../utils/pagination');

async function findAll(shopId, query) {
  const { skip, take, page, limit } = parsePagination(query);
  const [items, total] = await Promise.all([
    db.messagingCampaign.findMany({ where: { shopId }, skip, take, orderBy: { createdAt: 'desc' } }),
    db.messagingCampaign.count({ where: { shopId } }),
  ]);
  return { items, meta: buildMeta(total, page, limit) };
}

async function findById(id, shopId) {
  return db.messagingCampaign.findFirst({ where: { id, shopId } });
}

async function create(data) {
  return db.messagingCampaign.create({ data });
}

async function update(id, shopId, data) {
  return db.messagingCampaign.updateMany({ where: { id, shopId }, data });
}

module.exports = { findAll, findById, create, update };
