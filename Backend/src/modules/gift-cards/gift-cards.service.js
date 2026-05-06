'use strict';

const crypto = require('crypto');
const qrcode = require('qrcode');
const repository = require('./gift-cards.repository');
const db = require('../../config/db');

function generateCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function list(shopId, query) {
  return repository.findAll(shopId, query);
}

async function getById(shopId, id) {
  const card = await repository.findById(id, shopId);
  if (!card) throw Object.assign(new Error('Gift card not found'), { status: 404 });
  const qrCodeImage = await qrcode.toDataURL(card.code);
  return { ...card, qrCodeImage };
}

async function create(shopId, userId, data) {
  const code = generateCode();
  
  const giftCard = await repository.create({
    code,
    value: data.value,
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    status: 'active',
    shopId,
    createdBy: userId,
  });

  // Log creation
  await db.auditLog.create({
    data: {
      shopId,
      userId,
      action: 'gift_card_created',
      entityType: 'GiftCard',
      entityId: giftCard.id,
      details: { value: data.value, code },
    }
  });

  const qrCodeImage = await qrcode.toDataURL(code);
  
  return { ...giftCard, qrCodeImage };
}

async function validateCode(shopId, code) {
  const card = await repository.findByCode(code, shopId);
  if (!card) throw Object.assign(new Error('Invalid card code'), { status: 404 });
  
  if (card.status === 'used') {
    const usedByUser = card.usedBy ? await db.user.findUnique({ where: { id: card.usedBy } }) : null;
    const staffName = usedByUser ? usedByUser.name : 'Unknown Staff';
    const dateUsed = card.usedAt ? card.usedAt.toLocaleDateString() : 'Unknown Date';
    throw Object.assign(new Error(`Card already redeemed on ${dateUsed} by ${staffName}`), { status: 422 });
  }

  if (card.status === 'expired' || (card.expiryDate && new Date(card.expiryDate) < new Date())) {
    const expiry = card.expiryDate ? card.expiryDate.toLocaleDateString() : 'Unknown Date';
    throw Object.assign(new Error(`Card expired on ${expiry}`), { status: 422 });
  }

  if (card.status !== 'active') {
    throw Object.assign(new Error(`Invalid card status: ${card.status}`), { status: 422 });
  }

  return card;
}

async function redeem(shopId, userId, { code }) {
  const card = await validateCode(shopId, code);

  const updatedCard = await db.giftCard.update({
    where: { id: card.id },
    data: {
      status: 'used',
      usedAt: new Date(),
      usedBy: userId,
    }
  });

  // Log redemption
  await db.auditLog.create({
    data: {
      shopId,
      userId,
      action: 'gift_card_redeemed',
      entityType: 'GiftCard',
      entityId: card.id,
      details: { value: card.value, code },
    }
  });

  return updatedCard;
}

async function softDelete(shopId, id) {
  const card = await repository.findById(id, shopId);
  if (!card) throw Object.assign(new Error('Gift card not found'), { status: 404 });
  if (card.status === 'used') throw Object.assign(new Error('Cannot delete a redeemed gift card'), { status: 422 });

  const deleted = await db.giftCard.update({
    where: { id: card.id },
    data: { deletedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      shopId,
      userId: card.createdBy,
      action: 'gift_card_deleted',
      entityType: 'GiftCard',
      entityId: card.id,
      details: { code: card.code, value: card.value },
    },
  });

  return deleted;
}

module.exports = { list, getById, create, validateCode, redeem, softDelete };
