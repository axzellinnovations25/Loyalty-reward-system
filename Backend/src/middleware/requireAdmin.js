'use strict';

const { forbidden } = require('../utils/apiResponse');

/**
 * Blocks requests from non-admin users.
 * Must be placed after authenticate middleware.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return forbidden(res, 'Admin access required');
  }
  next();
}

module.exports = requireAdmin;
