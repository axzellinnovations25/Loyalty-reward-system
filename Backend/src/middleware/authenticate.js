'use strict';

const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/apiResponse');

/**
 * Verifies the Bearer JWT, attaches req.user and req.shopId.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return unauthorized(res);

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    req.shopId = payload.shopId;
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired token');
  }
}

module.exports = authenticate;
