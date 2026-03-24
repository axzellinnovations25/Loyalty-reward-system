'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

async function login({ email, password }) {
  const user = await db.user.findUnique({ where: { email }, include: { shop: true } });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  const token = signToken({ userId: user.id, shopId: user.shopId, role: user.role });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, shopId: user.shopId } };
}

async function register({ name, email, password, shopName, phone }) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  const freePlan = await db.plan.findUnique({ where: { slug: 'free' } });

  const user = await db.$transaction(async (tx) => {
    const shop = await tx.shop.create({ data: { name: shopName } });
    await tx.subscription.create({
      data: { shopId: shop.id, planId: freePlan?.id, isTrial: false },
    });
    return tx.user.create({
      data: { name, email, passwordHash, phone, role: 'owner', shopId: shop.id },
    });
  });

  const token = signToken({ userId: user.id, shopId: user.shopId, role: user.role });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, shopId: user.shopId } };
}

async function me(userId) {
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, shopId: true, createdAt: true },
  });
}

module.exports = { login, register, me };
