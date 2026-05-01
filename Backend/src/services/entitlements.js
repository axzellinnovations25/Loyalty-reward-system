'use strict';

const db = require('../config/db');
const cache = require('./cache');

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

/**
 * Resolves the active plan and feature/limit entitlements for a shop.
 * Caches the result to reduce DB hits.
 *
 * @returns {{ planId: string, features: Set<string>, limits: Map<string,number> }}
 */
async function resolve(shopId) {
  const cacheKey = `entitlements:${shopId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    include: {
      plan: {
        include: { features: true },
      },
      featureOverrides: true,
    },
  });

  if (!shop) throw new Error(`Shop ${shopId} not found`);

  const plan = shop.plan;
  const features = new Set();
  const limits = new Map();

  // Load from plan
  for (const pf of plan?.features ?? []) {
    if (pf.featureKey && pf.enabled) {
      features.add(pf.featureKey);
    }
    if (pf.limitKey) {
      limits.set(pf.limitKey, pf.limitValue ?? -1);
    }
  }

  // Apply per-shop overrides
  for (const override of shop.featureOverrides ?? []) {
    if (override.featureKey) {
      override.enabled ? features.add(override.featureKey) : features.delete(override.featureKey);
    }
    if (override.limitKey) {
      limits.set(override.limitKey, override.limitValue ?? -1);
    }
  }

  const result = { planId: shop.planId, features, limits };
  cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

/**
 * Returns true if the shop has the given feature enabled.
 */
async function hasFeature(shopId, featureKey) {
  const { features } = await resolve(shopId);
  return features.has(featureKey);
}

/**
 * Returns the numeric limit value for a shop.
 * -1 = Unlimited.
 */
async function getLimit(shopId, limitKey) {
  const { limits } = await resolve(shopId);
  return limits.get(limitKey) ?? 0;
}

/**
 * Busts the entitlement cache for a shop (call after plan change).
 */
function invalidate(shopId) {
  cache.del(`entitlements:${shopId}`);
}

module.exports = { resolve, hasFeature, getLimit, invalidate };
