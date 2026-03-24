'use strict';

/**
 * Simple in-memory TTL cache.
 * Used for per-shop SMS credentials and entitlement lookups.
 */
const store = new Map();

/**
 * @param {string} key
 * @param {*} value
 * @param {number} ttlMs - time-to-live in milliseconds (default 5 minutes)
 */
function set(key, value, ttlMs = 5 * 60 * 1000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function del(key) {
  store.delete(key);
}

function flush() {
  store.clear();
}

module.exports = { set, get, del, flush };
