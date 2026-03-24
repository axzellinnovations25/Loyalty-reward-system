'use strict';

const service = require('./gift-cards.service');
const { ok, created } = require('../../utils/apiResponse');

const list   = async (req, res, next) => { try { const { items, meta } = await service.list(req.shopId, req.query); return ok(res, items, meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return ok(res, await service.getById(req.shopId, req.params.id)); } catch (e) { next(e); } };
const create = async (req, res, next) => { try { return created(res, await service.create(req.shopId, req.body)); } catch (e) { next(e); } };
const redeem = async (req, res, next) => { try { return ok(res, await service.redeem(req.shopId, req.body)); } catch (e) { next(e); } };

module.exports = { list, getById, create, redeem };
