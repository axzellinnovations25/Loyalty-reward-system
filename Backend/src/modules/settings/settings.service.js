'use strict';

const repository = require('./settings.repository');
const { encrypt } = require('../../services/encryption');
const { del: cacheDel } = require('../../services/cache');

async function get(shopId) {
  const settings = await repository.findByShopId(shopId);
  if (!settings) return {};
  // Never expose the encrypted API key
  const { smsApiKeyEncrypted, ...safe } = settings;
  return { ...safe, hasSmsApiKey: !!smsApiKeyEncrypted };
}

async function update(shopId, data) {
  const payload = { ...data };

  if (data.smsApiKey) {
    payload.smsApiKeyEncrypted = encrypt(data.smsApiKey);
    delete payload.smsApiKey;
    cacheDel(`sms_creds:${shopId}`);
  }

  return repository.upsert(shopId, payload);
}

module.exports = { get, update };
