'use strict';

const entitlements = require('../services/entitlements');
const db = require('../config/db');
const { forbidden } = require('../utils/apiResponse');

/**
 * Factory: checks that the shop hasn't reached the `limitKey` cap before
 * allowing a CREATE operation.
 *
 * @param {string} limitKey  - e.g. 'customers', 'sms_per_month'
 * @param {Function} countFn - async (shopId) => currentCount
 */
function requireLimit(limitKey, countFn) {
  return async (req, res, next) => {
    try {
      const max = await entitlements.getLimit(req.shopId, limitKey);
      if (max === -1) return next(); // unlimited

      const current = await countFn(req.shopId);
      if (current >= max) {
        return forbidden(res, `You have reached the ${limitKey} limit (${max}) on your current plan`);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = requireLimit;
