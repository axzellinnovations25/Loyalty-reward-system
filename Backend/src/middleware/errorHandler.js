'use strict';

const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Prisma not-found error
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, error: 'Record not found' });
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, error: 'A record with that value already exists' });
  }

  // Prisma table/view does not exist (usually means migrations not applied)
  if (err.code === 'P2021') {
    return res.status(503).json({
      success: false,
      error: 'Database schema is missing tables (run Prisma migrations)',
    });
  }

  // Prisma client/schema mismatch (usually means prisma generate not run after schema change)
  if (err?.name === 'PrismaClientValidationError' && typeof err?.message === 'string') {
    const msg = err.message.toLowerCase();
    if (msg.includes('unknown field') || msg.includes('unknown arg') || msg.includes('unknown argument')) {
      return res.status(503).json({
        success: false,
        error: 'Backend Prisma client is out of date (run prisma generate and restart server)',
      });
    }
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  res.status(status).json({ success: false, error: message });
}

module.exports = errorHandler;
