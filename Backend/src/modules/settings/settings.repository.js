'use strict';

const db = require('../../config/db');

async function findByShopId(shopId) {
  return db.shopSettings.findUnique({ where: { shopId } });
}

async function upsert(shopId, data) {
  return db.shopSettings.upsert({
    where: { shopId },
    update: data,
    create: { shopId, ...data },
  });
}

module.exports = { findByShopId, upsert };
