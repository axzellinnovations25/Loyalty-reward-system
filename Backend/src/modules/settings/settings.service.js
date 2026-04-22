'use strict';

const repository = require('./settings.repository');

async function get(shopId) {
  const settings = await repository.findByShopId(shopId);
  if (!settings) return {};
  // Never expose the raw encrypted API key value
  const { textlkApiKey: _hidden, ...safe } = settings;
  return { ...safe, hasApiKey: !!_hidden };
}

async function update(shopId, data) {
  return repository.upsert(shopId, data);
}

module.exports = { get, update };
