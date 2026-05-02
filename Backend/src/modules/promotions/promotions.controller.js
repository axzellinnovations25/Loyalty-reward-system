'use strict';

const service = require('./promotions.service');

async function list(req, res, next) {
  try {
    const rows = await service.list(req.user.shopId);
    res.json({ success: true, data: rows });
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const row = await service.getById(req.user.shopId, req.params.id);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const row = await service.create(req.user.shopId, req.body);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const row = await service.update(req.user.shopId, req.params.id, req.body);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const row = await service.remove(req.user.shopId, req.params.id);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
}

async function preview(req, res, next) {
  try {
    const result = await service.preview(req.user.shopId, req.body);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, getById, create, update, remove, preview };

