'use strict';

const repository = require('./shops.repository');
const db         = require('../../../config/db');

async function list(query) { return repository.findAll(query); }

async function getById(id) {
  const shop = await repository.findById(id);
  if (!shop) throw Object.assign(new Error('Shop not found'), { status: 404 });
  return shop;
}

async function create(body, adminId) {
  const { name, email, contactInfo, planId } = body;

  // Verify the plan exists and is active
  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) throw Object.assign(new Error(`Plan '${planId}' not found`), { status: 404 });
  if (!plan.isActive) throw Object.assign(new Error(`Plan '${planId}' is inactive`), { status: 400 });

  return repository.create({ name, email, contactInfo, planId, planAssignedBy: adminId });
}

async function update(id, data) {
  await getById(id);
  
  return db.$transaction(async (tx) => {
    const updatedShop = await tx.shop.update({
      where: { id },
      data,
      include: { plan: true },
    });

    // If the shop is being disabled, disable all its users too
    if (data.isActive === false) {
      await tx.user.updateMany({
        where: { shopId: id },
        data: { isActive: false },
      });
    }

    return updatedShop;
  });
}

module.exports = { list, getById, create, update };
