'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../../../config/db');

function signAdminToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Authenticate a platform admin.
 * Returns { token, admin: { id, name, email } }
 */
async function login({ email, password }) {
  const admin = await db.adminUser.findUnique({ where: { email } });
  if (!admin) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const token = signAdminToken({ adminId: admin.id, role: 'superadmin' });

  return {
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email },
  };
}

/**
 * Return the current admin's profile (used by GET /admin/auth/me).
 */
async function me(adminId) {
  return db.adminUser.findUnique({
    where:  { id: adminId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
}

module.exports = { login, me };
