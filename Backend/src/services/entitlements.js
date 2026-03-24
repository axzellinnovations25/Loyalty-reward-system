'use strict';

const db = require('../config/db');
const cache = require('./cache');

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Resolves the active plan and feature/limit entitlements for a shop.
 * Caches the result to reduce DB hits.
 *
 * @returns {{ planId, features: Set<string>, limits: Map<string,number> }}
 */
async function resolve(shopId) {
  const cacheKey = `entitlements:${shopId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    include: {
      subscription: {
        include: {
          plan: {
            include: { features: true, limits: true },
          },
        },
      },
      entitlementOverrides: true,
    },
  });

  if (!shop) throw new Error(`Shop ${shopId} not found`);

  const plan = shop.subscription?.plan;
  const features = new Set(plan?.features.map(f => f.featureKey) ?? []);
  const limits = new Map(plan?.limits.map(l => [l.limitKey, l.value]) ?? []);

  // Apply per-shop overrides
  for (const override of shop.entitlementOverrides ?? []) {
    if (override.featureKey) {
      override.enabled ? features.add(override.featureKey) : features.delete(override.featureKey);
    }
    if (override.limitKey !== undefined) {
      limits.set(override.limitKey, override.value);
    }
  }

  const result = { planId: plan?.slug ?? 'free', features, limits };
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
 * Returns the numeric limit value for a shop, or 0 if unlimited (-1).
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
