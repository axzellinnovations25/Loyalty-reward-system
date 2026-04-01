'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

async function login({ username, password }) {
  const user = await db.user.findUnique({ where: { username }, include: { shop: true } });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  if (!user.isActive) throw Object.assign(new Error('Account is disabled'), { status: 403 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  // Update last login
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = signToken({ userId: user.id, shopId: user.shopId, role: user.role });
  return { 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      username: user.username, 
      role: user.role, 
      shopId: user.shopId,
      forcePasswordChange: user.forcePasswordChange
    } 
  };
}

async function register({ name, email, password, shopName, phone }) {
  const existing = await db.user.findUnique({ where: { username: email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  // We find 'basic' as default plan instead of 'free' since schema uses basic/standard/pro/enterprise
  const basicPlan = await db.plan.findUnique({ where: { id: 'basic' } });

  const user = await db.$transaction(async (tx) => {
    const shop = await tx.shop.create({ 
      data: { 
        name: shopName, 
        email, 
        phone,
        planId: basicPlan?.id || 'basic'
      } 
    });
    
    return tx.user.create({
      data: { 
        name, 
        username: email, // Owner uses email as username
        passwordHash, 
        role: 'owner', 
        shopId: shop.id 
      },
    });
  });

  const token = signToken({ userId: user.id, shopId: user.shopId, role: user.role });
  return { 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      username: user.username, 
      role: user.role, 
      shopId: user.shopId,
      forcePasswordChange: user.forcePasswordChange
    } 
  };
}

async function me(userId) {
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, username: true, role: true, shopId: true, createdAt: true },
  });
}

module.exports = { login, register, me };
