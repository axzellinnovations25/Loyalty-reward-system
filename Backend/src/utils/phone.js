'use strict';

const SRI_LANKA_REGEX = /^(?:\+94|0094|0)(7[0-9]{8})$/;

/**
 * Normalises any Sri Lankan mobile number to +94XXXXXXXXX format.
 * Returns null if invalid.
 */
function normalise(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.replace(/\s+/g, '');
  const match = cleaned.match(SRI_LANKA_REGEX);
  if (!match) return null;
  return `+94${match[1]}`;
}

/**
 * Returns true if the number is a valid Sri Lankan mobile number.
 */
function isValid(raw) {
  return normalise(raw) !== null;
}

module.exports = { normalise, isValid };
