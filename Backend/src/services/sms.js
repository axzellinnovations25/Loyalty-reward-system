'use strict';

const https = require('https');
const cache = require('./cache');
const { decrypt } = require('./encryption');
const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Retrieves decrypted SMS credentials for a shop.
 * Credentials are cached for 5 minutes.
 */
async function getCredentials(shopId) {
  const cacheKey = `sms_creds:${shopId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const settings = await db.shopSettings.findUnique({ where: { shopId } });
  if (!settings?.smsApiKeyEncrypted) {
    throw new Error(`No SMS credentials configured for shop ${shopId}`);
  }

  const creds = {
    apiKey: decrypt(settings.smsApiKeyEncrypted),
    senderId: settings.smsSenderId || 'LOYALTY',
  };

  cache.set(cacheKey, creds);
  return creds;
}

/**
 * Sends an SMS message via text.lk API.
 *
 * @param {string} shopId
 * @param {string} to - recipient phone number in +94XXXXXXXXX format
 * @param {string} message
 */
async function send(shopId, to, message) {
  const { apiKey, senderId } = await getCredentials(shopId);
  const apiUrl = process.env.SMS_API_URL || 'https://app.text.lk/api/v3/sms/send';

  const payload = JSON.stringify({
    recipient: to,
    sender_id: senderId,
    message,
    api_key: apiKey,
  });

  logger.info('Sending SMS', { shopId, to, messageLength: message.length });

  const result = await httpPost(apiUrl, payload);
  logger.info('SMS sent', { shopId, to, result });
  return result;
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      { hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { resolve(data); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { send };
