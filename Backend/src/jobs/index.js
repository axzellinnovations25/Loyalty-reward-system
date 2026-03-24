'use strict';

const cron = require('node-cron');
const logger = require('../utils/logger');

const pointsExpiry = require('./pointsExpiry');
const expiryWarning = require('./expiryWarning');
const trialExpiry = require('./trialExpiry');
const trialWarning = require('./trialWarning');
const giftCardExpiry = require('./giftCardExpiry');
const usageWarning = require('./usageWarning');

function schedule(name, expression, handler) {
  cron.schedule(expression, async () => {
    try {
      await handler();
    } catch (err) {
      logger.error(`Job ${name} failed`, { error: err.message, stack: err.stack });
    }
  });
  logger.info(`Job scheduled: ${name}`, { expression });
}

function startJobs() {
  // Run daily at 01:00 AM
  schedule('pointsExpiry',  '0 1 * * *', pointsExpiry.run);
  schedule('expiryWarning', '0 1 * * *', expiryWarning.run);
  schedule('trialExpiry',   '0 1 * * *', trialExpiry.run);
  schedule('trialWarning',  '0 1 * * *', trialWarning.run);
  schedule('giftCardExpiry','0 1 * * *', giftCardExpiry.run);
  schedule('usageWarning',  '0 2 * * *', usageWarning.run);
}

module.exports = { startJobs };
