'use strict';

const entitlements = require('../services/entitlements');
const { forbidden } = require('../utils/apiResponse');

/**
 * Factory: returns middleware that blocks the request if the shop
 * doesn't have `featureKey` enabled on their plan.
 *
 * Usage:  router.get('/campaigns', authenticate, requireFeature('sms_campaigns'), controller.list)
 */
function requireFeature(featureKey) {
  return async (req, res, next) => {
    try {
      const allowed = await entitlements.hasFeature(req.shopId, featureKey);
      if (!allowed) return forbidden(res, `Your plan does not include the '${featureKey}' feature`);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = requireFeature;
