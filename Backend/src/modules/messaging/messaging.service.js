'use strict';

const repository = require('./messaging.repository');
const sms = require('../../services/sms');
const db = require('../../config/db');
const logger = require('../../utils/logger');

async function list(shopId, query) { return repository.findAll(shopId, query); }

async function getById(shopId, id) {
  const campaign = await repository.findById(id, shopId);
  if (!campaign) throw Object.assign(new Error('Campaign not found'), { status: 404 });
  return campaign;
}

async function send(shopId, data) {
  const recipients = await resolveRecipients(shopId, data);

  const campaign = await repository.create({
    shopId,
    message: data.message,
    recipientType: data.recipientType,
    recipientCount: recipients.length,
    status: data.scheduledAt ? 'SCHEDULED' : 'SENDING',
    scheduledAt: data.scheduledAt ?? null,
  });

  if (!data.scheduledAt) {
    dispatchSMS(shopId, campaign.id, recipients, data.message);
  }

  return campaign;
}

async function resolveRecipients(shopId, data) {
  if (data.recipientType === 'individual') {
    return db.customer.findMany({
      where: { shopId, id: { in: data.customerIds }, phone: { not: null } },
      select: { phone: true },
    });
  }

  if (data.recipientType === 'all') {
    return db.customer.findMany({ where: { shopId, phone: { not: null } }, select: { phone: true } });
  }

  // segment — extend with real logic as needed
  return db.customer.findMany({ where: { shopId, phone: { not: null } }, select: { phone: true } });
}

async function dispatchSMS(shopId, campaignId, recipients, message) {
  let sent = 0, failed = 0;
  for (const { phone } of recipients) {
    try {
      await sms.send(shopId, phone, message);
      sent++;
    } catch (err) {
      failed++;
      logger.warn('SMS dispatch failed', { shopId, phone, err: err.message });
    }
  }
  await repository.update(campaignId, shopId, { status: 'SENT', sentCount: sent, failedCount: failed });
}

module.exports = { list, getById, send };
