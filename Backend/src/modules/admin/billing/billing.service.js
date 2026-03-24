'use strict';

const repository = require('./billing.repository');
const db = require('../../../config/db');
const { invalidate } = require('../../../services/entitlements');

async function list(query) { return repository.findAll(query); }

async function getById(id) {
  const record = await repository.findById(id);
  if (!record) throw Object.assign(new Error('Billing record not found'), { status: 404 });
  return record;
}

async function create(data) {
  return repository.create(data);
}

/**
 * Assigns a plan to a shop (used after payment confirmation).
 */
async function assignPlan(shopId, { planId, isTrial = false, trialDays = 0 }) {
  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) throw Object.assign(new Error('Plan not found'), { status: 404 });

  const trialEndsAt = isTrial ? new Date(Date.now() + trialDays * 86400000) : null;

  await db.subscription.upsert({
    where: { shopId },
    update: { planId, isTrial, trialEndsAt, trialWarningSent: false },
    create: { shopId, planId, isTrial, trialEndsAt },
  });

  invalidate(shopId);
  return db.subscription.findUnique({ where: { shopId }, include: { plan: true } });
}

module.exports = { list, getById, create, assignPlan };
