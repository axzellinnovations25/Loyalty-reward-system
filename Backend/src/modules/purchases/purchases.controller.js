'use strict';

const service = require('./purchases.service');
const { ok, created } = require('../../utils/apiResponse');

const list    = async (req, res, next) => { try { const { items, meta } = await service.list(req.shopId, req.query); return ok(res, items, meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return ok(res, await service.getById(req.shopId, req.params.id)); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { return created(res, await service.create(req.shopId, { ...req.body, userId: req.user.userId })); } catch (e) { next(e); } };
const voidPurchase = async (req, res, next) => { try { return ok(res, await service.voidPurchase(req.shopId, req.params.id, req.user.userId)); } catch (e) { next(e); } };

module.exports = { list, getById, create, voidPurchase };
