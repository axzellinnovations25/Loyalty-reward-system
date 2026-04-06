'use strict';

const jwt = require('jsonwebtoken');
const { unauthorized, forbidden } = require('../utils/apiResponse');

/**
 * Verifies the Bearer JWT and ensures role === 'superadmin'.
 * Attaches req.admin = { adminId, role } on success.
 */
async function authenticateAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return unauthorized(res);

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return unauthorized(res, 'Invalid or expired token');
  }

  if (payload.role !== 'superadmin') {
    return forbidden(res, 'Admin access required');
  }

  req.admin = payload;
  next();
}

module.exports = authenticateAdmin;
